from main import greet


def test_greet_returns_expected_message() -> None:
    assert greet("World") == "Hello, World!"
    assert greet("Alice") == "Hello, Alice!"
