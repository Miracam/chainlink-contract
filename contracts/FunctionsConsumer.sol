// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

// interface NFT {
//   function safeMint(address to, string memory uri) external;
// }



/**
 * @title Chainlink Functions example on-demand consumer contract example
 */
contract FunctionsConsumer is FunctionsClient, ConfirmedOwner {
  using FunctionsRequest for FunctionsRequest.Request;

  bytes32 public donId; // DON ID for the Functions DON to which the requests are sent

  bytes32 public s_lastRequestId;
  bytes public s_lastResponse;
  bytes public s_lastError;
  string public s_lastUrl;

  mapping(address => string) public attesterOf;
  
  struct ResponseBody {
    address owner;
    string attester;
  }

  string public source;

  event Response(bytes32 indexed requestId, bytes response, bytes err);
  event Attested(bytes32 indexed requestId, address indexed owner, string attester, string url);

  constructor(address router, bytes32 _donId, string memory _source) FunctionsClient(router) ConfirmedOwner(0x7f9a8F9687fbdEb1680C855251F538dd35597f64) {
    donId = _donId;
    source = _source;
  }

  /**
   * @notice Set the DON ID
   * @param newDonId New DON ID
   */
  function setDonId(bytes32 newDonId) external onlyOwner {
    donId = newDonId;
  }

  function setSource(string memory _source) external onlyOwner {
    source = _source;
  }

  function sendRequest(
    string[] calldata args,
    uint64 subscriptionId,
    uint32 callbackGasLimit
  ) external onlyOwner {
    FunctionsRequest.Request memory req;
    req.initializeRequest(FunctionsRequest.Location.Inline, FunctionsRequest.CodeLanguage.JavaScript, source);
    if (args.length > 0) {
      req.setArgs(args);
    }
    s_lastRequestId = _sendRequest(req.encodeCBOR(), subscriptionId, callbackGasLimit, donId);
    s_lastUrl = args[0];
  }

  /**
   * @notice Store latest result/error
   * @param requestId The request ID, returned by sendRequest()
   * @param response Aggregated response from the user code
   * @param err Aggregated error from the user code or from the execution pipeline
   * Either response or error parameter will be set, but never both
   */
  function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
    s_lastResponse = response;
    s_lastError = err;
    if (response.length > 0) {
      ResponseBody memory res = abi.decode(response, (ResponseBody));

      require(bytes(attesterOf[res.owner]).length == 0, "Already attested");
      attesterOf[res.owner] = res.attester;
      emit Response(requestId, response, err);
      emit Attested(requestId, res.owner, res.attester, s_lastUrl);
    }
  }
}
