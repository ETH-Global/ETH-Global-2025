// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./New_final_TenderV2.sol"; // Import your existing tender contract

contract TenderFactory {
    address[] public allTenders;
    mapping(address => address[]) public companyTenders;

    event TenderCreated(
        address indexed company,
        address tenderAddress,
        uint256 durationInMinutes,
        uint256 minSuccessfulParticipants,
        uint256 maxParticipants,
        uint256 stake
    );

    /// @notice Create a new tender by sending ETH as stake
    /// @param _durationInMinutes Duration of tender in Minutes
    /// @param _minSuccessfulParticipants Minimum participants required
    /// @param _maxParticipants Maximum participants allowed
    function createTender(
        uint256 _durationInMinutes,
        uint256 _minSuccessfulParticipants,
        uint256 _maxParticipants
    ) external payable returns (address) {
        // Ensure some stake is sent
        require(msg.value > 0, "Send ETH to stake");

        // Deploy the new MySepolia tender contract with the sent ETH
        MySepolia newTender = (new MySepolia){value: msg.value}(
            _durationInMinutes,
            _minSuccessfulParticipants,
            _maxParticipants
        );

        address tenderAddress = address(newTender);

        // Save references
        allTenders.push(tenderAddress);
        companyTenders[msg.sender].push(tenderAddress);

        emit TenderCreated(
            msg.sender,
            tenderAddress,
            _durationInMinutes,
            _minSuccessfulParticipants,
            _maxParticipants,
            msg.value
        );

        return tenderAddress;
    }

    /// @notice Get all tenders deployed by a company
    function getCompanyTenders(address _company) external view returns (address[] memory) {
        return companyTenders[_company];
    }

    /// @notice Get all tenders deployed through this factory
    function getAllTenders() external view returns (address[] memory) {
        return allTenders;
    }
}
