#!/usr/bin/env python3
"""
label-characterization.py

Post-processes a characterization test file to add // CHARACTERIZATION markers
to all test functions that lack them.

Usage:
    python label-characterization.py <test_file.py>
    python label-characterization.py <test_file.py> --dry-run

Or pipe content through:
    cat tests/foo.spec.py | python label-characterization.py -
"""

import sys
import re
import argparse
from pathlib import Path


def label_file(filepath: str, dry_run: bool = False) -> int:
    content = Path(filepath).read_text()
    original = content

    # Match test functions (pytest style, unittest style, etc.)
    test_pattern = re.compile(r'^(\s*)(def test_\w+|def \w+\(self\):)', re.MULTILINE)
    characterization_marker = 'CHARACTERIZATION'

    def add_marker(match):
        indent, func_def = match.groups()
        # Check if this test already has a CHARACTERIZATION comment
        lines_after = content[match.start():].split('\n')[:5]
        already_has_marker = any(
            characterization_marker in line
            for line in lines_after
        )
        if already_has_marker:
            return match.group(0)
        return match.group(0) + f'\n{indent}    # CHARACTERIZATION: documents current behavior'

    modified = test_pattern.sub(add_marker, content)

    if modified == original:
        print(f"No unlabeled tests found in {filepath}")
        return 0

    if dry_run:
        print(f"[DRY RUN] Would modify {filepath}")
        print("--- Diff ---")
        for i, (old, new) in enumerate(zip(original.splitlines(), modified.splitlines())):
            if old != new:
                print(f"  {i+1}: {old}")
                print(f"      {new}")
        return 0

    Path(filepath).write_text(modified)
    print(f"Labeled tests in {filepath}")
    return 1


def main():
    parser = argparse.ArgumentParser(description='Add CHARACTERIZATION markers to tests')
    parser.add_argument('file', help='Test file to label (or "-" for stdin)')
    parser.add_argument('--dry-run', action='store_true', help='Show changes without modifying')
    args = parser.parse_args()

    if args.file == '-':
        content = sys.stdin.read()
        sys.stdout.write(content)  # No-op for stdin mode
    else:
        count = label_file(args.file, args.dry_run)
        sys.exit(0 if count == 0 else 0)


if __name__ == '__main__':
    main()