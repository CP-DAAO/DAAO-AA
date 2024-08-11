// SPDX-License-Identifier: MIT

pragma solidity ^0.8.23;

contract Counter {
    uint256 internal _counter;

    function counter() external view returns (uint256) {
        return _counter;
    }

    function up() external {
        _counter += 1;
    }
}
