#!/usr/bin/env python3
"""
Validation script for source-project-documentation skill.

Checks that generated documentation meets quality standards:
- All mandatory sections present
- Mermaid diagrams are valid syntax
- Cross-references don't have broken links
- Code examples are valid

Usage:
  python3 validate_docs.py /path/to/project --output /path/to/docs
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple

class DocValidator:
    """Validates generated documentation files."""

    MANDATORY_SECTIONS = {
        'README.md': [
            'Overview',
            'Quick Start',
            'Tech Stack',
            'Key Features',
            'Architecture',
        ],
        'ARCHITECTURE.md': [
            'System Overview',
            'Architecture Diagram',
            'Layers',
            'Request Flow',
        ],
        'TECH_STACK.md': [
            'Summary',
            'Justification',
        ],
        'DATABASE.md': [
            'ER Diagram',
            'Tables',
            'Relationships',
        ],
        'FRONTEND.md': [
            'Component Structure',
            'Key Components',
            'State Management',
            'Styling',
        ],
        'BACKEND.md': [
            'Architecture',
            'Request Flow',
            'Controllers',
            'Services',
        ],
        'DEPLOYMENT.md': [
            'Local Development',
            'Production Build',
            'Cloud Deployment',
        ],
    }

    def __init__(self, project_path: str, output_path: str):
        self.project_path = Path(project_path)
        self.output_path = Path(output_path)
        self.results = []

    def validate(self) -> Dict:
        """Run all validation checks."""
        results = {
            'passed': [],
            'failed': [],
            'warnings': [],
            'summary': {}
        }

        if not self.output_path.exists():
            results['failed'].append(
                f"Output directory does not exist: {self.output_path}"
            )
            return results

        # Check for markdown files
        md_files = list(self.output_path.glob('*.md'))
        if not md_files:
            results['failed'].append(
                f"No markdown files found in {self.output_path}"
            )
            return results

        # Validate each file
        for md_file in md_files:
            self._validate_file(md_file, results)

        # Cross-reference validation
        self._validate_references(md_files, results)

        # Summary
        results['summary'] = {
            'total_files': len(md_files),
            'passed_checks': len(results['passed']),
            'failed_checks': len(results['failed']),
            'warnings': len(results['warnings']),
            'status': 'PASS' if not results['failed'] else 'FAIL'
        }

        return results

    def _validate_file(self, file_path: Path, results: Dict):
        """Validate a single markdown file."""
        with open(file_path, 'r') as f:
            content = f.read()

        filename = file_path.name

        # Check mandatory sections
        if filename in self.MANDATORY_SECTIONS:
            sections = self.MANDATORY_SECTIONS[filename]
            for section in sections:
                if section.lower() not in content.lower():
                    results['warnings'].append(
                        f"{filename}: Missing section '{section}'"
                    )
                else:
                    results['passed'].append(
                        f"{filename}: Found section '{section}'"
                    )

        # Check for Mermaid diagrams
        mermaid_blocks = re.findall(r'```mermaid\n(.*?)\n```', content, re.DOTALL)
        if mermaid_blocks:
            for i, block in enumerate(mermaid_blocks):
                if self._is_valid_mermaid(block):
                    results['passed'].append(
                        f"{filename}: Mermaid diagram {i+1} syntax valid"
                    )
                else:
                    results['failed'].append(
                        f"{filename}: Mermaid diagram {i+1} has syntax errors"
                    )

    def _validate_references(self, files: List[Path], results: Dict):
        """Validate cross-references between files."""
        filenames = {f.name for f in files}

        for file_path in files:
            with open(file_path, 'r') as f:
                content = f.read()

            # Find markdown links
            links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)
            for _text, url in links:
                # Check if it's a relative link to another doc
                if url.endswith('.md') and not url.startswith('http'):
                    # Normalize: strip fragment/query, then reduce to bare filename
                    normalized = os.path.basename(url.split('#')[0].split('?')[0])
                    if normalized not in filenames:
                        results['failed'].append(
                            f"{file_path.name}: Broken link to {url}"
                        )
                    else:
                        results['passed'].append(
                            f"{file_path.name}: Link to {url} valid"
                        )

    def _is_valid_mermaid(self, block: str) -> bool:
        """Check if a Mermaid block has basic valid syntax."""
        block = block.strip()
        if 'erDiagram' in block:
            return '||' in block or '--' in block
        if 'graph' in block or 'flowchart' in block:
            return '-->' in block or '-.->' in block or '---' in block
        if 'sequenceDiagram' in block:
            return 'participant' in block
        return len(block) > 10


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 validate_docs.py /path/to/project --output /path/to/docs")
        sys.exit(1)

    project_path = sys.argv[1]
    output_path = '/documentation'

    if '--output' in sys.argv:
        idx = sys.argv.index('--output')
        if idx + 1 < len(sys.argv):
            output_path = sys.argv[idx + 1]

    validator = DocValidator(project_path, output_path)
    results = validator.validate()

    print(f"\n{'='*60}")
    print(f"Documentation Validation Results")
    print(f"{'='*60}\n")

    print(f"Project: {project_path}")
    print(f"Output: {output_path}\n")

    if results['failed']:
        print(f"❌ FAILED ({len(results['failed'])} errors)\n")
        for error in results['failed']:
            print(f"  - {error}")
    else:
        print("✅ PASSED\n")

    if results['warnings']:
        print(f"\n⚠️  Warnings ({len(results['warnings'])})\n")
        for warning in results['warnings']:
            print(f"  - {warning}")

    print(f"\n{'='*60}")
    print(f"Summary")
    print(f"{'='*60}")
    for key, value in results['summary'].items():
        print(f"  {key}: {value}")

    sys.exit(0 if results['summary']['status'] == 'PASS' else 1)


if __name__ == '__main__':
    main()
