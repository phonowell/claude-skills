#!/usr/bin/env python3
"""Unit tests for acp_client.py using unittest"""

import unittest
from unittest.mock import Mock, MagicMock, patch, call
import json
import subprocess
import sys
from io import BytesIO

from acp_client import ACPClient, ACPError, ACPConnectionError, ACPProtocolError, ACPTimeoutError


class TestACPClient(unittest.TestCase):
    """Test ACPClient class"""

    def setUp(self):
        """Set up test fixtures"""
        self.client = ACPClient(verbose=False, quiet=True)

    def test_init(self):
        """Test ACPClient initialization"""
        client = ACPClient(verbose=True, quiet=False)
        self.assertTrue(client.verbose)
        self.assertFalse(client.quiet)
        self.assertIsNone(client.proc)

    def test_send_request_no_process(self):
        """Test send_request raises error when process not started"""
        with self.assertRaises(ACPConnectionError) as ctx:
            self.client.send_request(1, "test", {})
        self.assertIn("Process not started", str(ctx.exception))

    @patch('subprocess.Popen')
    def test_send_request_success(self, mock_popen):
        """Test send_request sends valid JSON-RPC request"""
        mock_proc = Mock()
        mock_stdin = Mock()
        mock_proc.stdin = mock_stdin
        mock_popen.return_value = mock_proc
        self.client.proc = mock_proc

        self.client.send_request(1, "initialize", {"protocolVersion": 1})

        mock_stdin.write.assert_called_once()
        written = mock_stdin.write.call_args[0][0]
        data = json.loads(written)

        self.assertEqual(data["jsonrpc"], "2.0")
        self.assertEqual(data["id"], 1)
        self.assertEqual(data["method"], "initialize")
        self.assertEqual(data["params"]["protocolVersion"], 1)
        mock_stdin.flush.assert_called_once()

    @patch('subprocess.Popen')
    def test_send_request_broken_pipe(self, mock_popen):
        """Test send_request handles BrokenPipeError"""
        mock_proc = Mock()
        mock_proc.stdin.write.side_effect = BrokenPipeError("pipe broken")
        self.client.proc = mock_proc

        with self.assertRaises(ACPConnectionError) as ctx:
            self.client.send_request(1, "test", {})
        self.assertIn("Failed to send request", str(ctx.exception))

    @patch('select.select')
    @patch('time.sleep')
    @patch('time.time')
    def test_read_lines_success(self, mock_time, mock_sleep, mock_select):
        """Test read_lines reads JSON responses"""
        mock_proc = Mock()
        mock_stdout = Mock()

        responses = [
            b'{"jsonrpc":"2.0","id":1,"result":{}}\n',
            b'{"jsonrpc":"2.0","id":2,"result":{"sessionId":"ses_123"}}\n',
        ]
        mock_stdout.readline.side_effect = responses + [b''] * 100  # Prevent side_effect exhaustion
        mock_proc.stdout = mock_stdout

        # Simulate: ready for 2 reads, then timeout
        counter = [0]
        def select_mock(*args):
            counter[0] += 1
            if counter[0] <= 2:
                return ([mock_stdout], [], [])
            return ([], [], [])

        mock_select.side_effect = select_mock
        mock_time.side_effect = [0, 0.1, 0.2, 0.3, 0.6]  # Start, then exceed 0.5 timeout
        self.client.proc = mock_proc

        lines = self.client.read_lines(timeout=0.5)

        self.assertEqual(len(lines), 2)
        self.assertEqual(lines[0]["id"], 1)
        self.assertEqual(lines[1]["result"]["sessionId"], "ses_123")

    @patch('select.select')
    def test_read_lines_protocol_error(self, mock_select):
        """Test read_lines raises ACPProtocolError on error response"""
        mock_proc = Mock()
        mock_stdout = Mock()

        error_response = b'{"jsonrpc":"2.0","id":1,"error":{"code":-32602,"message":"Invalid params"}}\n'
        mock_stdout.readline.return_value = error_response
        mock_proc.stdout = mock_stdout
        mock_select.return_value = ([mock_stdout], [], [])
        self.client.proc = mock_proc

        with self.assertRaises(ACPProtocolError) as ctx:
            self.client.read_lines(timeout=0.5)

        self.assertEqual(ctx.exception.code, -32602)
        self.assertIn("Invalid params", str(ctx.exception))

    @patch('select.select')
    def test_read_lines_timeout(self, mock_select):
        """Test read_lines handles timeout gracefully"""
        mock_proc = Mock()
        mock_select.return_value = ([], [], [])
        self.client.proc = mock_proc

        lines = self.client.read_lines(timeout=0.1)
        self.assertEqual(lines, [])


    @patch('subprocess.Popen')
    def test_execute_task_opencode_not_found(self, mock_popen):
        """Test execute_task raises error when opencode not found"""
        mock_popen.side_effect = FileNotFoundError("opencode not found")

        with self.assertRaises(ACPConnectionError) as ctx:
            self.client.execute_task("/tmp", "test task")
        self.assertIn("opencode command not found", str(ctx.exception))

    @patch('subprocess.Popen')
    @patch.object(ACPClient, 'send_request')
    @patch.object(ACPClient, 'read_lines')
    @patch('time.time')
    def test_execute_task_success(self, mock_time, mock_read_lines, mock_send_request, mock_popen):
        """Test execute_task complete workflow"""
        mock_proc = Mock()
        mock_proc.stdin = Mock()
        mock_proc.stdout = Mock()

        # Mock readline to return stop signal
        mock_proc.stdout.readline.side_effect = [
            '{"jsonrpc":"2.0","method":"session/update","params":{"update":{"sessionUpdate":"agent_message_chunk","content":{"type":"text","text":"output"}}}}\n',
            '{"jsonrpc":"2.0","id":3,"result":{"stopReason":"end_turn"}}\n'
        ]
        mock_popen.return_value = mock_proc

        # Mock read_lines responses
        init_response = [{"jsonrpc": "2.0", "id": 1, "result": {}}]
        session_response = [{"jsonrpc": "2.0", "id": 2, "result": {"sessionId": "ses_test"}}]
        mock_read_lines.side_effect = [init_response, session_response]

        # Mock time to avoid timeout
        mock_time.side_effect = [0, 0, 0, 0.1, 0.2]

        output, count = self.client.execute_task("/tmp", "test task", timeout=1)

        # Verify calls
        self.assertEqual(mock_send_request.call_count, 3)
        mock_send_request.assert_any_call(1, "initialize", {
            "protocolVersion": 1,
            "capabilities": {},
            "clientInfo": {"name": "claude-code", "version": "1.0"}
        })
        mock_send_request.assert_any_call(2, "session/new", {
            "cwd": "/tmp",
            "mcpServers": []
        })

        self.assertEqual(output, "output")
        self.assertEqual(count, 2)
        mock_proc.terminate.assert_called_once()

    @patch('subprocess.Popen')
    @patch.object(ACPClient, 'send_request')
    @patch.object(ACPClient, 'read_lines')
    @patch('time.time')
    def test_execute_task_with_model_id(self, mock_time, mock_read_lines, mock_send_request, mock_popen):
        """Test execute_task with model_id parameter"""
        mock_proc = Mock()
        mock_proc.stdin = Mock()
        mock_proc.stdout = Mock()

        mock_proc.stdout.readline.side_effect = [
            '{"jsonrpc":"2.0","id":3,"result":{"stopReason":"end_turn"}}\n'
        ]
        mock_popen.return_value = mock_proc

        init_response = [{"jsonrpc": "2.0", "id": 1, "result": {}}]
        session_response = [{"jsonrpc": "2.0", "id": 2, "result": {"sessionId": "ses_test"}}]
        mock_read_lines.side_effect = [init_response, session_response]

        mock_time.side_effect = [0, 0, 0, 0.1]

        output, count = self.client.execute_task("/tmp", "test", timeout=1, model_id="opencode/glm-4.7-free")

        # Verify modelId is included in session/prompt
        prompt_call = mock_send_request.call_args_list[2]
        self.assertEqual(prompt_call[0][0], 3)
        self.assertEqual(prompt_call[0][1], "session/prompt")
        self.assertIn("modelId", prompt_call[0][2])
        self.assertEqual(prompt_call[0][2]["modelId"], "opencode/glm-4.7-free")
        mock_proc.terminate.assert_called_once()

    @patch('subprocess.Popen')
    @patch.object(ACPClient, 'send_request')
    @patch.object(ACPClient, 'read_lines')
    def test_execute_task_no_session_id(self, mock_read_lines, mock_send_request, mock_popen):
        """Test execute_task fails when sessionId not received"""
        mock_proc = Mock()
        mock_proc.stdin = Mock()
        mock_popen.return_value = mock_proc

        init_response = [{"jsonrpc": "2.0", "id": 1, "result": {}}]
        session_response = [{"jsonrpc": "2.0", "id": 2, "result": {}}]  # No sessionId
        mock_read_lines.side_effect = [init_response, session_response]

        with self.assertRaises(ACPProtocolError) as ctx:
            self.client.execute_task("/tmp", "test task", timeout=1)

        self.assertIn("Failed to create session", str(ctx.exception))
        mock_proc.terminate.assert_called_once()

    @patch('subprocess.Popen')
    @patch.object(ACPClient, 'send_request')
    @patch.object(ACPClient, 'read_lines')
    @patch('time.time')
    def test_execute_task_timeout(self, mock_time, mock_read_lines, mock_send_request, mock_popen):
        """Test execute_task raises timeout error"""
        mock_proc = Mock()
        mock_proc.stdin = Mock()
        mock_proc.stdout.readline.return_value = b''
        mock_popen.return_value = mock_proc

        init_response = [{"jsonrpc": "2.0", "id": 1, "result": {}}]
        session_response = [{"jsonrpc": "2.0", "id": 2, "result": {"sessionId": "ses_test"}}]
        mock_read_lines.side_effect = [init_response, session_response]

        # Simulate timeout: start_time, loop iterations, then timeout
        times = [0, 0, 0]  # Initial calls
        times.extend([0.1 * i for i in range(20)])  # Loop iterations (time.time() - start_time)
        times.append(100)  # Trigger timeout
        mock_time.side_effect = times

        with self.assertRaises(ACPTimeoutError) as ctx:
            self.client.execute_task("/tmp", "test task", timeout=1)

        self.assertIn("timeout", str(ctx.exception).lower())
        mock_proc.terminate.assert_called_once()


class TestACPExceptions(unittest.TestCase):
    """Test custom exception classes"""

    def test_acp_error(self):
        """Test ACPError base exception"""
        err = ACPError("test error")
        self.assertEqual(str(err), "test error")

    def test_acp_connection_error(self):
        """Test ACPConnectionError"""
        err = ACPConnectionError("connection failed")
        self.assertIsInstance(err, ACPError)
        self.assertEqual(str(err), "connection failed")

    def test_acp_protocol_error(self):
        """Test ACPProtocolError with code and data"""
        err = ACPProtocolError(-32602, "Invalid params", {"field": "cwd"})
        self.assertIsInstance(err, ACPError)
        self.assertEqual(err.code, -32602)
        self.assertEqual(err.message, "Invalid params")
        self.assertEqual(err.data["field"], "cwd")
        self.assertIn("[-32602]", str(err))

    def test_acp_timeout_error(self):
        """Test ACPTimeoutError"""
        err = ACPTimeoutError("Task timeout")
        self.assertIsInstance(err, ACPError)
        self.assertEqual(str(err), "Task timeout")


if __name__ == '__main__':
    unittest.main()
