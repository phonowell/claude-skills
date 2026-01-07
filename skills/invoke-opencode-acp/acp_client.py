#!/usr/bin/env python3
"""OpenCode ACP Protocol Client (Enhanced)

Usage:
    python3 acp_client_v2.py [OPTIONS] <cwd> <task>

Options:
    -q, --quiet         Suppress output (only errors)
    -v, --verbose       Show all responses
    -t, --timeout SEC   Task timeout in seconds (default: 120)
    -o, --output FILE   Save final output to file

Example:
    python3 acp_client_v2.py -v /path/to/project "Optimize code"
"""

import subprocess
import json
import time
import sys
import select
import argparse
from typing import Optional, Dict, List, Tuple


class ACPError(Exception):
    """Base exception for ACP protocol errors"""
    pass


class ACPConnectionError(ACPError):
    """Connection/process errors"""
    pass


class ACPProtocolError(ACPError):
    """Protocol-level errors"""
    def __init__(self, code: int, message: str, data: dict = None):
        self.code = code
        self.message = message
        self.data = data or {}
        super().__init__(f"[{code}] {message}")


class ACPTimeoutError(ACPError):
    """Timeout errors"""
    pass


class ACPClient:
    """OpenCode ACP Protocol Client"""

    def __init__(self, verbose: bool = False, quiet: bool = False):
        self.verbose = verbose
        self.quiet = quiet
        self.proc = None

    def _log(self, msg: str, level: str = "info"):
        """Internal logging"""
        if self.quiet and level != "error":
            return

        prefix = {"info": "", "debug": ">>> ", "response": "<<< ", "error": "✗ "}
        target = sys.stderr if level in ("debug", "response") else sys.stdout

        if level == "debug" and not self.verbose:
            return

        print(f"{prefix.get(level, '')}{msg}", file=target, flush=True)

    def send_request(self, req_id: int, method: str, params: dict):
        """Send JSON-RPC request"""
        if not self.proc:
            raise ACPConnectionError("Process not started")

        request = json.dumps({
            "jsonrpc": "2.0",
            "id": req_id,
            "method": method,
            "params": params
        })

        self._log(request, "debug")

        try:
            self.proc.stdin.write(request + '\n')
            self.proc.stdin.flush()
        except (BrokenPipeError, OSError) as e:
            raise ACPConnectionError(f"Failed to send request: {e}")

    def read_lines(self, timeout: float = 2, log: bool = True) -> List[Dict]:
        """Read JSON-RPC responses with timeout"""
        responses = []
        start = time.time()

        while time.time() - start < timeout:
            try:
                ready, _, _ = select.select([self.proc.stdout], [], [], 0.1)
            except (ValueError, OSError):
                break

            if ready:
                line = self.proc.stdout.readline().strip()
                if line:
                    if log and self.verbose:
                        self._log(line, "response")
                    try:
                        data = json.loads(line)
                        responses.append(data)

                        # Check for errors
                        if "error" in data:
                            err = data["error"]
                            raise ACPProtocolError(
                                err.get("code", -1),
                                err.get("message", "Unknown error"),
                                err.get("data", {})
                            )
                    except json.JSONDecodeError:
                        if log:
                            self._log(f"Invalid JSON: {line}", "error")

            time.sleep(0.05)

        return responses


    def execute_task(
        self,
        cwd: str,
        task: str,
        timeout: float = 120,
        model_id: Optional[str] = None
    ) -> Tuple[str, int]:
        """Execute task via OpenCode ACP protocol

        Args:
            cwd: Working directory for the session
            task: Task description to execute
            timeout: Timeout in seconds for task execution
            model_id: Model ID to use (e.g., 'opencode/glm-4.7-free')
                      NOTE: OpenCode ACP v1.1.4 ignores this parameter.
                      Reserved for future versions.

        Returns:
            Tuple of (final_output, response_count)

        Raises:
            ACPConnectionError: Process/connection errors
            ACPProtocolError: Protocol-level errors
            ACPTimeoutError: Task timeout
        """
        try:
            self.proc = subprocess.Popen(
                ['opencode', 'acp'],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
        except FileNotFoundError:
            raise ACPConnectionError("opencode command not found")
        except Exception as e:
            raise ACPConnectionError(f"Failed to start process: {e}")

        output_chunks = []  # Only store message chunks

        try:
            # 1. Initialize
            self.send_request(1, "initialize", {
                "protocolVersion": 1,
                "capabilities": {},
                "clientInfo": {"name": "claude-code", "version": "1.0"}
            })

            # Discard init response without logging
            self.read_lines(3, log=False)

            # 2. Create session
            self.send_request(2, "session/new", {
                "cwd": cwd,
                "mcpServers": []
            })

            # Discard session init without logging
            lines = self.read_lines(3, log=False)

            # Extract sessionId only
            session_id = None
            for line in lines:
                if "result" in line and "sessionId" in line.get("result", {}):
                    session_id = line["result"]["sessionId"]
                    self._log(f"✓ Session: {session_id}")
                    break

            if not session_id:
                raise ACPProtocolError(-1, "Failed to create session")

            # 3. Execute task
            self._log(f"[EXECUTING: {task}]")
            prompt_params = {
                "sessionId": session_id,
                "prompt": [{
                    "type": "text",
                    "text": task
                }]
            }
            if model_id:
                prompt_params["modelId"] = model_id
            self.send_request(3, "session/prompt", prompt_params)

            # Read responses for specified timeout
            start_time = time.time()
            task_complete = False
            response_count = 0

            while time.time() - start_time < timeout:
                try:
                    line = self.proc.stdout.readline().strip()
                    if line:
                        if self.verbose:
                            self._log(line, "response")
                        try:
                            data = json.loads(line)
                            response_count += 1

                            # Only store agent message chunks
                            if data.get("method") == "session/update":
                                update = data.get("params", {}).get("update", {})
                                if update.get("sessionUpdate") == "agent_message_chunk":
                                    content = update.get("content", {})
                                    if content.get("type") == "text":
                                        output_chunks.append(content.get("text", ""))

                            # Check for task completion
                            if data.get("result", {}).get("stopReason") == "end_turn":
                                task_complete = True
                                break
                        except json.JSONDecodeError:
                            pass
                except Exception:
                    break

            if not task_complete and time.time() - start_time >= timeout:
                raise ACPTimeoutError(f"Task timeout after {timeout}s")

            final_output = "".join(output_chunks)
            self._log(f"✓ Task completed: {response_count} responses")

            return final_output, response_count

        finally:
            if self.proc:
                self.proc.stdin.close()
                self.proc.terminate()
                try:
                    self.proc.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    self.proc.kill()


def main():
    parser = argparse.ArgumentParser(
        description="OpenCode ACP Protocol Client",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("cwd", help="Working directory")
    parser.add_argument("task", help="Task description")
    parser.add_argument("-q", "--quiet", action="store_true", help="Suppress output")
    parser.add_argument("-v", "--verbose", action="store_true", help="Show all responses")
    parser.add_argument("-t", "--timeout", type=float, default=120, help="Timeout (seconds)")
    parser.add_argument("-o", "--output", help="Save final output to file")
    parser.add_argument("-m", "--model", help="Model ID (e.g., opencode/glm-4.7-free) - NOTE: Currently ignored by OpenCode ACP v1.1.4")

    args = parser.parse_args()

    client = ACPClient(verbose=args.verbose, quiet=args.quiet)

    try:
        final_output, count = client.execute_task(args.cwd, args.task, args.timeout, args.model)

        if args.output:
            with open(args.output, 'w') as f:
                f.write(final_output)
            print(f"✓ Output saved to {args.output}")

        if final_output and not args.quiet:
            print("\n=== Final Output ===")
            print(final_output)

        sys.exit(0)

    except ACPTimeoutError as e:
        print(f"✗ Timeout: {e}", file=sys.stderr)
        sys.exit(2)
    except ACPProtocolError as e:
        print(f"✗ Protocol error: {e}", file=sys.stderr)
        sys.exit(3)
    except ACPConnectionError as e:
        print(f"✗ Connection error: {e}", file=sys.stderr)
        sys.exit(4)
    except Exception as e:
        print(f"✗ Unexpected error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(5)


if __name__ == "__main__":
    main()
