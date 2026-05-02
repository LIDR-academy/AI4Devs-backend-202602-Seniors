#!/usr/bin/env python3
"""
Story Validation Script

Validates that a user story markdown file meets the Definition of Ready (DoR) checklist.
Outputs a report with missing sections, incomplete items, and improvement suggestions.

Usage:
  python validate_story.py /path/to/story.md
"""

import sys
import re
from pathlib import Path
from typing import ClassVar, Dict, List, Tuple

class StoryValidator:
    """Validates enriched user story markdown files."""

    # Required sections (must be present)
    REQUIRED_SECTIONS: ClassVar[Dict[str, str]] = {
        "Narrative & Business Value": r"##\s+📖\s+Narrative & Business Value",
        "User Story": r"###\s+User Story",
        "Business Value": r"###\s+Business Value",
        "Out of Scope": r"###\s+Out of Scope",
        "Acceptance Criteria": r"##\s+✅\s+Acceptance Criteria",
        "Technical Design": r"##\s+🏗️\s+Technical Design",
        "Affected Systems": r"###\s+Affected Systems & Domains",
        "Data Model Changes": r"###\s+Data Model Changes",
        "API Contract Changes": r"###\s+API Contract Changes",
        "Implementation Notes": r"###\s+Implementation Notes",
        "Non-Functional Requirements": r"###\s+Non-Functional Requirements",
        "Dependencies": r"###\s+Dependencies",
        "Observability": r"###\s+Observability",
        "Security & Privacy": r"###\s+Security & Privacy",
        "Rollout & Rollback Plan": r"###\s+Rollout & Rollback Plan",
        "Project Analysis Linkage": r"##\s+🔗\s+Project Analysis Linkage",
        "Referenced Analysis Documents": r"###\s+Referenced Analysis Documents",
        "Traceability to Business Goals": r"###\s+Traceability to Business Goals",
        "Definition of Ready": r"##\s+📋\s+Definition of Ready",
        "Definition of Done": r"##\s+✨\s+Definition of Done",
    }

    # Optional but recommended sections (none currently; all template sections are required)
    RECOMMENDED_SECTIONS: ClassVar[Dict[str, str]] = {}

    def __init__(self, story_path: str):
        self.story_path = Path(story_path)
        self.content: str = ""
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.suggestions: List[str] = []

    def validate(self) -> Dict:
        """Run all validation checks."""

        # Check file exists before attempting to read
        if not self.story_path.exists():
            self.errors.append(f"File not found: {self.story_path}")
            return self._report()

        self.content = self.story_path.read_text()

        # Check for required sections
        self._check_required_sections()

        # Check for recommended sections
        self._check_recommended_sections()

        # Check metadata
        self._check_metadata()

        # Check acceptance criteria quality
        self._check_acceptance_criteria()

        # Check analysis linkage
        self._check_analysis_linkage()

        # Check for vague language
        self._check_vague_language()

        return self._report()

    def _check_required_sections(self):
        """Verify all required sections are present."""
        for section_name, pattern in self.REQUIRED_SECTIONS.items():
            if not re.search(pattern, self.content, re.IGNORECASE):
                self.errors.append(f"Missing required section: {section_name}")

    def _check_recommended_sections(self):
        """Verify recommended sections are present."""
        for section_name, pattern in self.RECOMMENDED_SECTIONS.items():
            if not re.search(pattern, self.content, re.IGNORECASE):
                self.warnings.append(f"Missing recommended section: {section_name}")

    def _check_metadata(self):
        """Check story metadata (ID, title, status, date)."""
        has_title = re.search(r"^#\s+\[?STORY-\d+\]?\s*:?\s+", self.content, re.MULTILINE)
        if not has_title:
            self.warnings.append("Story ID and title not in expected format (e.g., '# STORY-042 [Title]')")

        has_status = re.search(r"\*\*Status:\*\*\s+(Draft|Ready|In Progress|Done)", self.content)
        if not has_status:
            self.warnings.append("Status not set (should be: Draft, Ready, In Progress, or Done)")

        has_dates = re.search(r"\*\*Created:\*\*.*\*\*Last Updated:\*\*", self.content, re.DOTALL)
        if not has_dates:
            self.warnings.append("Creation and update dates not documented")

    def _check_acceptance_criteria(self):
        """Check acceptance criteria quality."""
        ac_section = re.search(
            r"##\s+✅\s+Acceptance Criteria.*?(?=##\s+🏗️|##\s+🔗|$)",
            self.content,
            re.DOTALL
        )

        if not ac_section:
            self.errors.append("Acceptance criteria section not found or malformed")
            return

        ac_text = ac_section.group()

        # Count checkboxes
        checkboxes = re.findall(r"- \[ \]", ac_text)
        if len(checkboxes) < 3:
            self.warnings.append(f"Only {len(checkboxes)} acceptance criteria found; recommend 5-10")

        # Check for specific criteria (not vague)
        vague_patterns = [
            r"should work",
            r"works properly",
            r"functions correctly",
            r"performs well",
            r"handles errors",
            r"is user-friendly",
        ]

        for pattern in vague_patterns:
            if re.search(pattern, ac_text, re.IGNORECASE):
                self.suggestions.append(
                    f"Acceptance criteria contains vague language: '{pattern}'. "
                    f"Make it testable (e.g., 'API returns 201 on success' instead of 'works properly')"
                )

    def _check_analysis_linkage(self):
        """Check for strong analysis linkage."""
        linkage_section = re.search(
            r"##\s+🔗\s+Project Analysis Linkage.*?(?=##\s+📋|$)",
            self.content,
            re.DOTALL
        )

        if not linkage_section:
            self.errors.append("Project Analysis Linkage section not found")
            return

        linkage_text = linkage_section.group()

        # Check for specific document references
        if "file:" not in linkage_text and not re.search(r"docs/.*\.md", linkage_text):
            self.errors.append(
                "No specific analysis document references found. "
                "Linkage must include file paths or URLs (e.g., 'file: docs/discovery/user-research.md')"
            )

        # Check for vague analysis references
        vague_refs = [
            r"per analysis",
            r"per documentation",
            r"as discussed",
            r"see confluence",
            r"per spec",
        ]

        for vague in vague_refs:
            if re.search(vague, linkage_text, re.IGNORECASE):
                self.suggestions.append(
                    f"Analysis linkage is vague: '{vague}'. "
                    f"Replace with specific references (e.g., 'file: docs/impact/analysis-v2.md, Section 3.2')"
                )

        # Check for traceability
        has_traceability = re.search(r"###\s+Traceability to Business Goals", linkage_text)
        if not has_traceability:
            self.warnings.append("Traceability to Business Goals section not found in analysis linkage")

        # Check for assumptions
        has_assumptions = re.search(r"###\s+Assumptions", linkage_text)
        if not has_assumptions:
            self.warnings.append("Assumptions section not found in analysis linkage")

    def _check_vague_language(self):
        """Check for vague language throughout the story."""
        vague_terms = [
            (r"\bretc\b", "Use 'e.g.' or 'for example' instead of 'etc.'"),
            (r"\bshould\b.*\bproperly\b", "Specify what 'properly' means; make it testable"),
            (r"\bcan\b.*\bany\b", "Be specific; avoid 'any' without bounds"),
            (r"standard implementation", "Describe the implementation; don't reference 'standards' vaguely"),
            (r"as needed", "Specify the trigger or condition"),
            (r"if necessary", "Specify when it's necessary"),
            (r"tbd", "Complete the thought; don't leave TODOs in final story"),
        ]

        for pattern, suggestion in vague_terms:
            if re.search(pattern, self.content, re.IGNORECASE):
                self.suggestions.append(f"Vague language found: '{pattern}'. {suggestion}")

    def _report(self) -> Dict:
        """Generate validation report."""
        return {
            "valid": len(self.errors) == 0,
            "errors": self.errors,
            "warnings": self.warnings,
            "suggestions": self.suggestions,
        }

def print_report(report: Dict, story_path: str):
    """Pretty-print validation report."""
    print(f"\n{'='*70}")
    print(f"Story Validation Report: {story_path}")
    print(f"{'='*70}\n")

    if report["valid"]:
        print("✅ **PASS** — Story meets Definition of Ready")
    else:
        print("❌ **FAIL** — Story does not meet Definition of Ready")

    if report["errors"]:
        print(f"\n⚠️  **ERRORS** ({len(report['errors'])} blocking issues):")
        for i, error in enumerate(report["errors"], 1):
            print(f"  {i}. {error}")

    if report["warnings"]:
        print(f"\n⚠️  **WARNINGS** ({len(report['warnings'])} items to review):")
        for i, warning in enumerate(report["warnings"], 1):
            print(f"  {i}. {warning}")

    if report["suggestions"]:
        print(f"\n💡 **SUGGESTIONS** ({len(report['suggestions'])} improvements):")
        for i, suggestion in enumerate(report["suggestions"], 1):
            print(f"  {i}. {suggestion}")

    print(f"\n{'='*70}\n")

    # Exit with error code if validation failed
    sys.exit(0 if report["valid"] else 1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_story.py /path/to/story.md")
        sys.exit(1)

    story_path = sys.argv[1]
    validator = StoryValidator(story_path)
    report = validator.validate()
    print_report(report, story_path)
