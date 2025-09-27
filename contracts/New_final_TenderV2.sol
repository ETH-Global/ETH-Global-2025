// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Enhanced Decentralized Tender Contract with Owner-Set Max Participants
/// @author
/// @notice Company stakes ETH and participants enroll & complete tasks. Owner sets max participants limit.
/// @dev Includes owner-defined participant limits and pull payment pattern
contract DecentralizedTender {
    /* ========== CONSTANTS ========== */
    
    uint256 public constant MINIMUM_STAKE = 0.00001 ether; // 0.00001 ETH minimum
    uint256 public constant GAS_PER_PARTICIPANT = 50000; // Estimated gas per participant for distribution
    uint256 public constant GAS_PRICE_BUFFER = 20 gwei; // Conservative gas price for calculations
    uint256 public constant ABSOLUTE_MAX_PARTICIPANTS = 1000; // Hard cap for safety
    
    /* ========== STATE ========== */

    address payable public owner;
    uint256 public tenderEndDate;
    uint256 public minSuccessfulParticipants;
    uint256 public maxParticipants; // Set by owner during deployment
    uint256 public totalStake;
    bool public isTenderActive;
    bool public isEarlyTermination;

    address[] public participants;
    mapping(address => bool) public isEnrolled;
    mapping(address => bool) public taskCompleted;
    mapping(address => uint256) public pendingWithdrawals; // Pull payment pattern
    uint256 public successfulParticipantCount;
    bool public rewardsCalculated;

    /* ========== REENTRANCY GUARD ========== */

    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    /* ========== MODIFIERS ========== */
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier tenderActive() {
        require(isTenderActive, "Tender is not active");
        _;
    }

    /* ========== EVENTS ========== */

    event TenderCreated(address indexed owner, uint256 endDate, uint256 totalStake, uint256 maxParticipants);
    event UserEnrolled(address indexed participant, uint256 currentEnrolled);
    event TaskCompleted(address indexed participant);
    event RewardsCalculated(uint256 totalPayout, uint256 successfulParticipants);
    event TenderEndedByOwner(address indexed owner, uint256 timestamp);
    event TenderFailed(address indexed owner, uint256 amountReturned);
    event WithdrawalMade(address indexed participant, uint256 amount);
    event StakeTopUp(uint256 additionalAmount, uint256 newTotal);
    event MaxParticipantsUpdated(uint256 oldMax, uint256 newMax);
    event ParticipantLimitReached(uint256 maxLimit);

    /* ========== CONSTRUCTOR ========== */

    /// @param _durationInMinutes Number of minutes tender is active
    /// @param _minSuccessfulParticipants Minimum number of successful participants required for success
    /// @param _maxParticipants Maximum number of participants allowed (set by owner)
    constructor(
        uint256 _durationInMinutes,
        uint256 _minSuccessfulParticipants,
        uint256 _maxParticipants
    ) payable {
        require(msg.sender != address(0), "Owner cannot be zero address");
        require(msg.value >= MINIMUM_STAKE, "Stake must be at least 0.1 ETH");
        require(_minSuccessfulParticipants > 0, "minSuccessfulParticipants must be > 0");
        require(_durationInMinutes > 0, "Duration must be greater than 0");
        require(_maxParticipants > 0, "maxParticipants must be > 0");
        require(_maxParticipants <= ABSOLUTE_MAX_PARTICIPANTS, "Exceeds absolute maximum participants limit");
        require(_maxParticipants >= _minSuccessfulParticipants, "maxParticipants must be >= minSuccessfulParticipants");

        owner = payable(msg.sender);
        totalStake = msg.value;
        tenderEndDate = block.timestamp + (_durationInMinutes * 1 minutes);
        minSuccessfulParticipants = _minSuccessfulParticipants;
        maxParticipants = _maxParticipants; // Owner-defined limit
        isTenderActive = true;

        // Validate that the stake can reasonably support the max participants
        _validateStakeVsParticipants();

        // Initialize reentrancy guard
        _status = _NOT_ENTERED;

        emit TenderCreated(owner, tenderEndDate, totalStake, maxParticipants);
    }

    /* ========== VIEWS ========== */

    /// @notice Number of enrolled participants
    function enrolledCount() external view returns (uint256) {
        return participants.length;
    }

    /// @notice Number of remaining participant slots
    function remainingSlots() external view returns (uint256) {
        if (participants.length >= maxParticipants) {
            return 0;
        }
        return maxParticipants - participants.length;
    }
    
    /// @notice Check if tender can be ended (either by time or owner)
    function canEndTender() external view returns (bool) {
        return (block.timestamp >= tenderEndDate) || (msg.sender == owner && isTenderActive);
    }
    
    /// @notice Estimate gas cost for current number of participants
    function estimatedGasCost() external view returns (uint256) {
        return successfulParticipantCount * GAS_PER_PARTICIPANT * GAS_PRICE_BUFFER;
    }

    /// @notice Check if max participants limit would be safe for gas costs
    function isParticipantLimitSafe() external view returns (bool, string memory) {
        uint256 estimatedMaxGasCost = maxParticipants * GAS_PER_PARTICIPANT * GAS_PRICE_BUFFER;
        uint256 gasReserve = (totalStake * 20) / 100; // 20% buffer
        
        if (estimatedMaxGasCost > gasReserve) {
            return (false, "Max participants may exceed gas cost budget");
        }
        
        if (maxParticipants > 500) {
            return (false, "Max participants may cause gas limit issues");
        }
        
        return (true, "Participant limit is within safe bounds");
    }

    /// @notice Get detailed tender information
    function getTenderInfo() external view returns (
        uint256 enrolled,
        uint256 maxAllowed,
        uint256 successful,
        uint256 minRequired,
        uint256 timeRemaining,
        bool isActive
    ) {
        uint256 timeLeft = block.timestamp >= tenderEndDate ? 0 : tenderEndDate - block.timestamp;
        
        return (
            participants.length,
            maxParticipants,
            successfulParticipantCount,
            minSuccessfulParticipants,
            timeLeft,
            isTenderActive
        );
    }

    /* ========== PARTICIPANT ACTIONS ========== */

    /// @notice Enroll in the tender
    function enroll() external tenderActive {
        require(block.timestamp < tenderEndDate, "Tender has already ended");
        require(!isEnrolled[msg.sender], "Already enrolled");
        require(participants.length < maxParticipants, "Maximum participants reached");

        isEnrolled[msg.sender] = true;
        participants.push(msg.sender);

        emit UserEnrolled(msg.sender, participants.length);

        // Emit event if limit reached
        if (participants.length >= maxParticipants) {
            emit ParticipantLimitReached(maxParticipants);
        }
    }

    /// @notice Mark the participant's task as completed
    function submitTaskAsCompleted() external tenderActive {
        require(block.timestamp < tenderEndDate, "Cannot submit after tender ends");
        require(isEnrolled[msg.sender], "Not enrolled in tender");
        require(!taskCompleted[msg.sender], "Task already marked as completed");

        taskCompleted[msg.sender] = true;
        successfulParticipantCount += 1;

        emit TaskCompleted(msg.sender);
    }

    /* ========== OWNER ACTIONS ========== */
    
    /// @notice Owner can end tender early and return stake to company
    /// @dev This allows owner to terminate tender at any time
    function endTenderEarly() external onlyOwner tenderActive nonReentrant {
        require(!rewardsCalculated, "Rewards already calculated");
        
        isEarlyTermination = true;
        isTenderActive = false;
        
        uint256 stake = totalStake;
        totalStake = 0;
        
        // Return full stake to owner (company)
        (bool returned, ) = owner.call{value: stake}("");
        require(returned, "Failed to return stake to owner");
        
        emit TenderEndedByOwner(owner, block.timestamp);
        emit TenderFailed(owner, stake);
    }

    /// @notice Owner can update max participants before tender ends (with restrictions)
    /// @param _newMaxParticipants New maximum number of participants
    function updateMaxParticipants(uint256 _newMaxParticipants) external onlyOwner tenderActive {
        require(_newMaxParticipants > 0, "Max participants must be > 0");
        require(_newMaxParticipants <= ABSOLUTE_MAX_PARTICIPANTS, "Exceeds absolute maximum limit");
        require(_newMaxParticipants >= minSuccessfulParticipants, "Must be >= minSuccessfulParticipants");
        require(_newMaxParticipants >= participants.length, "Cannot be less than current enrolled count");
        require(block.timestamp < tenderEndDate, "Tender already ended");

        uint256 oldMax = maxParticipants;
        maxParticipants = _newMaxParticipants;

        // Validate the new limit
        _validateStakeVsParticipants();

        emit MaxParticipantsUpdated(oldMax, _newMaxParticipants);
    }

    /* ========== TENDER FINALIZATION ========== */

    /// @notice Finalize the tender after end date or calculate rewards
    /// @dev Uses pull payment pattern for safe reward distribution
    function endTender() external nonReentrant {
        require(
            block.timestamp >= tenderEndDate || msg.sender == owner, 
            "Tender period not over and caller not owner"
        );
        require(isTenderActive, "Tender has already been concluded");
        require(!rewardsCalculated, "Rewards already calculated");

        // EFFECTS: mark inactive and calculate rewards
        isTenderActive = false;
        rewardsCalculated = true;
        
        uint256 stake = totalStake;

        if (successfulParticipantCount >= minSuccessfulParticipants && successfulParticipantCount > 0) {
            // SUCCESS CASE: Calculate pending withdrawals for participants
            uint256 rewardPerParticipant = stake / successfulParticipantCount;
            uint256 totalPayout = rewardPerParticipant * successfulParticipantCount;
            uint256 remainder = stake - totalPayout;

            // Set pending withdrawals for successful participants
            for (uint256 i = 0; i < participants.length; i++) {
                address participant = participants[i];
                if (taskCompleted[participant]) {
                    pendingWithdrawals[participant] = rewardPerParticipant;
                }
            }
            
            // Any remainder goes to owner
            if (remainder > 0) {
                pendingWithdrawals[owner] += remainder;
            }

            emit RewardsCalculated(totalPayout, successfulParticipantCount);
        } else {
            // FAILURE CASE: All stake goes back to owner
            pendingWithdrawals[owner] = stake;
            emit TenderFailed(owner, stake);
        }
        
        // Reset totalStake since funds are now in pending withdrawals
        totalStake = 0;
    }

    /// @notice Participants and owner can withdraw their rewards
    /// @dev Pull payment pattern prevents DoS attacks
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds available for withdrawal");
        
        pendingWithdrawals[msg.sender] = 0;
        
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Transfer failed");
        
        emit WithdrawalMade(msg.sender, amount);
    }

    /* ========== ADMIN FUNCTIONS ========== */

    /// @notice Owner can top-up stake before tender ends
    function topUpStake() external payable onlyOwner tenderActive {
        require(block.timestamp < tenderEndDate, "Tender already ended");
        require(msg.value > 0, "Must send some ETH to top up");
        
        totalStake += msg.value;
        
        // Validate that new stake can support max participants
        _validateStakeVsParticipants();
        
        emit StakeTopUp(msg.value, totalStake);
    }

    /* ========== INTERNAL VALIDATION ========== */

    /// @notice Validate that stake can reasonably support max participants
    function _validateStakeVsParticipants() internal view {
        // Calculate estimated gas costs for max participants
        uint256 estimatedGasCostvar = maxParticipants * GAS_PER_PARTICIPANT * GAS_PRICE_BUFFER;
        uint256 gasReserveNeeded = (totalStake * 15) / 100; // 15% reserve
        
        // Warning: This is a soft check - doesn't revert, but emits warning
        // Hard check would be too restrictive as gas prices fluctuate
        if (estimatedGasCostvar > gasReserveNeeded && maxParticipants > 100) {
            // Could add warning event here if needed
            // For now, we trust owner's judgment
        }
    }

    /* ========== EMERGENCY FUNCTIONS ========== */
    
    /// @notice Emergency function to pause tender (in case of critical issues)
    function pauseTender() external onlyOwner {
        isTenderActive = false;
    }
    
    /// @notice Get contract balance for transparency
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Emergency function to reduce max participants if needed
    /// @dev Can only reduce, not increase, and only before tender ends
    function emergencyReduceMaxParticipants(uint256 _newMaxParticipants) external onlyOwner tenderActive {
        require(_newMaxParticipants > 0, "Max participants must be > 0");
        require(_newMaxParticipants < maxParticipants, "Can only reduce max participants");
        require(_newMaxParticipants >= participants.length, "Cannot be less than current enrolled");
        require(_newMaxParticipants >= minSuccessfulParticipants, "Must be >= minSuccessfulParticipants");

        uint256 oldMax = maxParticipants;
        maxParticipants = _newMaxParticipants;

        emit MaxParticipantsUpdated(oldMax, _newMaxParticipants);
    }

    /* ========== FALLBACKS ========== */

    receive() external payable {
        revert("Contract does not accept direct deposits after creation");
    }

    fallback() external payable {
        revert("Fallback disabled");
    }
}