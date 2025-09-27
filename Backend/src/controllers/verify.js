import { SelfBackendVerifier,DefaultConfigStore, AllIds, countries } from "@selfxyz/core";
import "dotenv/config";

import parseWalletFromPaddedHex from "../utils/utils.js";

const ENDPOINT = process.env.ENDPOINT;

const staticConfig = {
  minimumAge: 15,
  excludedCountries: [countries.PAKISTAN],
  nationality: true,
  gender: true,
};

const defaultConfigStore = new DefaultConfigStore(staticConfig);

const selfBackendVerifier = new SelfBackendVerifier(
  "scope",   
  ENDPOINT,    
  false,        
  AllIds,
  defaultConfigStore,
  "hex",       
);

export async function UserVerification(req, res){
try {

    const { attestationId, proof, publicSignals, userContextData, actionId } = req.body
    console.log("user id:", req.body.userContextData);
    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return res.status(200).json({
        status: "error",
        result: false,
        reason: "Proof, publicSignals, attestationId and userContextData are required",
      })
    }

    const result = await selfBackendVerifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData
    );

    const { isValid, isMinimumAgeValid, isOfacValid } = result.isValidDetails;
    if (!isValid || !isMinimumAgeValid || !isOfacValid) {
      let reason = "Verification failed"
      if (!isMinimumAgeValid) reason = "Minimum age verification failed"
      if (!isOfacValid) reason = "OFAC verification failed"
      return res.status(200).json({
        status: "error",
        result: false,
        reason,
      })
    }

    // console.log("verification successful");

    const address = parseWalletFromPaddedHex(userContextData);
    console.log(address);

    return res.status(200).json({
      status: "success",
      result: true,
    })

  } catch (error) {
    return res.status(200).json({
        
        status: "error",
        result: false,
        reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}