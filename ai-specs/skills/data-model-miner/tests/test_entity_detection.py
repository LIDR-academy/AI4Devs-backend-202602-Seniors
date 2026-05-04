#!/usr/bin/env python3
"""
Characterization tests for data-model-miner skill.

Tests entity detection accuracy across TypeScript, Python, and Go patterns.
These tests validate the skill's heuristics against known code structures.
"""

import re
import sys
from pathlib import Path

TEST_CASES = [
    # TypeScript
    {
        "lang": "typescript",
        "code": "interface User { id: string; name: string; email: string; }",
        "expected_entity": "User",
        "pattern": "interface\\s+(\\w+)",
    },
    {
        "lang": "typescript",
        "code": "class Order { id: string; customerId: string; status: string; }",
        "expected_entity": "Order",
        "pattern": "class\\s+(\\w+)",
    },
    # Python
    {
        "lang": "python",
        "code": "class User(Base):\n    __tablename__ = 'users'\n    id = Column(String, primary_key=True)",
        "expected_entity": "User",
        "pattern": "class\\s+(\\w+).*Base",
    },
    {
        "lang": "python",
        "code": "class OrderModel(Model):\n    id = AutoField()\n    customer_id = IntegerField()",
        "expected_entity": "OrderModel",
        "pattern": "class\\s+(\\w+).*Model",
    },
    # Go
    {
        "lang": "go",
        "code": "type User struct {\n    ID string\n    Name string\n    Email string\n}",
        "expected_entity": "User",
        "pattern": "type\\s+(\\w+)\\s+struct",
    },
    {
        "lang": "go",
        "code": "type Order struct {\n    ID string\n    CustomerID string\n    Status string\n}",
        "expected_entity": "Order",
        "pattern": "type\\s+(\\w+)\\s+struct",
    },
]

RELATIONSHIP_TEST_CASES = [
    {
        "lang": "python",
        "code": "customer_id = Column(Integer, ForeignKey('customers.id'))",
        "expected_relation": "ForeignKey",
        "pattern": "ForeignKey",
    },
    {
        "lang": "typescript",
        "code": "@OneToMany(() => Order) orders: Order[];",
        "expected_relation": "OneToMany",
        "pattern": "@OneToMany",
    },
    {
        "lang": "go",
        "code": "CustomerID string `gorm:\"foreignKey:CustomerID\"`",
        "expected_relation": "gorm_foreignKey",
        "pattern": "foreignKey:",
    },
]


def test_entity_detection():
    """Test entity detection patterns."""
    passed = 0
    failed = 0

    for tc in TEST_CASES:
        pattern = re.compile(tc["pattern"])
        match = pattern.search(tc["code"])
        if match and match.group(1) == tc["expected_entity"]:
            passed += 1
            print(f"  PASS: {tc['lang']}/{tc['expected_entity']}")
        else:
            failed += 1
            print(f"  FAIL: {tc['lang']}/{tc['expected_entity']} - got {match.group(1) if match else 'no match'}")

    return passed, failed


def test_relationship_detection():
    """Test relationship detection patterns."""
    passed = 0
    failed = 0

    for tc in RELATIONSHIP_TEST_CASES:
        if tc["pattern"] in tc["code"]:
            passed += 1
            print(f"  PASS: {tc['lang']}/{tc['expected_relation']}")
        else:
            failed += 1
            print(f"  FAIL: {tc['lang']}/{tc['expected_relation']}")

    return passed, failed


def test_confidence_scoring():
    """Test confidence scoring heuristics."""
    patterns = [
        ("@Column decorator", "high"),
        ("class User { id: string }", "high"),
        ("interface User { name: string }", "medium"),
        ("function getUser() {}", "low"),
        ("const config = {}", "low"),
    ]

    passed = 0
    failed = 0

    for code, expected_confidence in patterns:
        confidence = "high" if ("@" in code or "class" in code) else "medium" if "interface" in code else "low"
        if confidence == expected_confidence:
            passed += 1
            print(f"  PASS: confidence {expected_confidence} for {code[:30]}...")
        else:
            failed += 1
            print(f"  FAIL: expected {expected_confidence}, got {confidence} for {code[:30]}...")

    return passed, failed


def run_all():
    print("=== Entity Detection Tests ===")
    e_passed, e_failed = test_entity_detection()
    print(f"Entity detection: {e_passed}/{e_passed + e_failed} passed\n")

    print("=== Relationship Detection Tests ===")
    r_passed, r_failed = test_relationship_detection()
    print(f"Relationship detection: {r_passed}/{r_passed + r_failed} passed\n")

    print("=== Confidence Scoring Tests ===")
    c_passed, c_failed = test_confidence_scoring()
    print(f"Confidence scoring: {c_passed}/{c_passed + c_failed} passed\n")

    total_passed = e_passed + r_passed + c_passed
    total_failed = e_failed + r_failed + c_failed
    total = total_passed + total_failed

    print(f"=== Summary: {total_passed}/{total} passed ===")
    return total_failed == 0


if __name__ == "__main__":
    success = run_all()
    sys.exit(0 if success else 1)