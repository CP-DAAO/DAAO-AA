// SPDX-License-Identifier: MIT

pragma solidity ^0.8.23;

import {BaseAccount} from "@account-abstraction/contracts/core/BaseAccount.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {SIG_VALIDATION_SUCCESS, SIG_VALIDATION_FAILED} from "@account-abstraction/contracts/core/Helpers.sol";

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract Wallet is BaseAccount, ERC721Holder, ERC1155Holder {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IEntryPoint private immutable _entryPoint;
    address public immutable factory;

    address public owner; // EOA
    address public agent; // DAAO Agent

    enum SignatureTypes {
        OWNER_SIGNATURE,
        AGENT_SIGNATURE // TODO: only castVote
    }

    event AccountInitialized(IEntryPoint indexed entryPoint);

    error UnauthorizedAccount(address account);

    /* Modifiers */

    modifier onlyFactory() {
        if (msg.sender != factory) {
            revert UnauthorizedAccount(msg.sender);
        }
        _;
    }

    modifier onlyEntryPoint() {
        if (msg.sender != address(_entryPoint)) {
            revert UnauthorizedAccount(msg.sender);
        }
        _;
    }

    /* Initialize */

    receive() external payable {}

    constructor(IEntryPoint entryPoint_, address factory_) {
        _entryPoint = entryPoint_;
        factory = factory_;

        emit AccountInitialized(_entryPoint);
    }

    function initialize(address owner_, address agent_) public onlyFactory {
        owner = owner_;
        agent = agent_;
    }

    /* Account Abstraction */

    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external onlyEntryPoint {
        _call(dest, value, func);
    }

    function executeBatch(
        address[] calldata dest,
        uint256[] calldata value,
        bytes[] calldata func
    ) external onlyEntryPoint {
        require(
            dest.length == func.length &&
                (value.length == 0 || value.length == func.length),
            "wrong array length"
        );
        if (value.length == 0) {
            for (uint256 i = 0; i < dest.length; i++) {
                address _dest = dest[i];
                bytes calldata _func = func[i];
                _call(_dest, 0, _func);
            }
        } else {
            for (uint256 i = 0; i < dest.length; i++) {
                address _dest = dest[i];
                bytes calldata _func = func[i];
                _call(_dest, value[i], _func);
            }
        }
    }

    function staticCall(
        address dest,
        uint256 value,
        bytes calldata func
    ) external view returns (bytes memory result) {
        require(value == 0, "STATICCALL cannot send value");

        return _staticCall(dest, 0, func);
    }

    function staticCallBatch(
        address[] calldata dest,
        uint256[] calldata value,
        bytes[] calldata func
    ) external view returns (bytes[] memory result) {
        require(value.length == 0, "STATICCALL cannot send value");
        require(
            dest.length == func.length &&
                (value.length == 0 || value.length == func.length),
            "wrong array length"
        );

        result = new bytes[](dest.length);
        for (uint256 i = 0; i < dest.length; i++) {
            address _dest = dest[i];
            bytes calldata _func = func[i];
            result[i] = _staticCall(_dest, 0, _func);
        }
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    function _staticCall(
        address target,
        uint256 value,
        bytes memory data
    ) internal view returns (bytes memory result) {
        value;
        bool success;
        (success, result) = target.staticcall(data);
        require(success, "staticcall fail");
    }

    /* Validate */

    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view virtual override returns (uint256 validationData) {
        SignatureTypes _signatureType = SignatureTypes(
            userOp.signature.length > 0
                ? uint256(uint8(userOp.signature[0]))
                : 0
        );

        function(bytes calldata, bytes32)
            view
            returns (uint256) validateSignature;

        if (_signatureType == SignatureTypes.OWNER_SIGNATURE) {
            validateSignature = _validateOwnerSignature;
        } else if (_signatureType == SignatureTypes.AGENT_SIGNATURE) {
            validateSignature = _validateAgentSignature;
        } else {
            revert("Invalid signature type");
        }

        // Call the selected validation function
        return validateSignature(userOp.signature[1:], userOpHash);
    }

    function _validateOwnerSignature(
        bytes calldata signature,
        bytes32 userOpHash
    ) internal view virtual returns (uint256 validationData) {
        bytes32 _hash = userOpHash.toEthSignedMessageHash();
        address recoveredAddress = _hash.recover(signature);
        if (recoveredAddress != owner) {
            return SIG_VALIDATION_FAILED;
        }
        return SIG_VALIDATION_SUCCESS;
    }

    function _validateAgentSignature(
        bytes calldata signature,
        bytes32 userOpHash
    ) internal view virtual returns (uint256 validationData) {
        bytes32 _hash = userOpHash.toEthSignedMessageHash();
        address recoveredAddress = _hash.recover(signature);
        if (recoveredAddress != agent) {
            return SIG_VALIDATION_FAILED;
        }
        return SIG_VALIDATION_SUCCESS;
    }

    function addDeposit() public payable onlyEntryPoint {
        _entryPoint.depositTo{value: msg.value}(address(this));
    }

    function withdrawDepositTo(
        address payable withdrawAddress,
        uint256 amount
    ) public onlyEntryPoint {
        _entryPoint.withdrawTo(withdrawAddress, amount);
    }

    /* Deposit */

    function getDeposit() public view returns (uint256) {
        return _entryPoint.balanceOf(address(this));
    }
}
