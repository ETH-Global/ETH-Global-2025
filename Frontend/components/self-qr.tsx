"use client";
import { useEffect, useState } from "react";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  countries,
} from "@selfxyz/qrcode";
import "dotenv/config";

// ✅ Types
interface SelfAppConfig {
  version: number;
  appName: string;
  scope: string;
  userId: string;
  userIdType: string;
  endpoint: string;
//   AllIds: typeof AllIds;
  logoBase64: string;
  disclosures: {
    minimumAge: number;
    excludedCountries: string[];
    nationality: boolean;
    gender: boolean;
    ofac:true;
  };
}

interface Attestation {
  id: string;
  userId: string;
  verified: boolean;
  [key: string]: unknown; // fallback for extra fields
}

const ENDPOINT = "https://insuperably-available-karren.ngrok-free.dev/verify";
// const ENDPOINT = "";
type verificationPageProps = {
    address : string;
}
export default function VerificationPage({ address }: verificationPageProps) {
  // 1. State to hold the configuration object for the QR code
  const [selfApp, setSelfApp] = useState<any>(null);

  // 2. This effect runs once to build the verification configuration
//   useEffect(() => {
//     // This should be a unique identifier for the user you are verifying
//     const uniqueUserId = address;

//     // Use the builder to define all your app's and user's specifications
//     const appConfig = new SelfAppBuilder({
//       version: 2,
//       appName: "My Basic Verification App",
//       scope: "scope", // must match backend
//       userId: uniqueUserId, // same on both sides
//       userIdType: "hex", // must match backend
//       endpoint: ENDPOINT, // your backend endpoint
//     //   AllIds: AllIds,
//       logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
//       // -- Define the "required specs of user" here --
//       disclosures: {
//         minimumAge: 15,
//         excludedCountries: [countries.PAKISTAN],
//         nationality: true,
//         gender: true,
//       },
//     }).build();

//     // Store the final configuration in our state
//     setSelfApp(appConfig);
//   }, []); // runs once when mounted

useEffect(() => {
  if (!address) return; // do nothing if address is empty

  // This should be a unique identifier for the user you are verifying
  const uniqueUserId = address;

  // Use the builder to define all your app's and user's specifications
  const appConfig = new SelfAppBuilder({
    version: 2,
    appName: "My Basic Verification App",
    scope: "scope", // must match backend
    userId: uniqueUserId, // current wallet address
    userIdType: "hex", // must match backend
    endpoint: ENDPOINT, // your backend endpoint
    logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
    disclosures: {
      minimumAge: 15,
      excludedCountries: [countries.PAKISTAN],
      nationality: true,
      gender: true,
      ofac: true, // if you want OFAC check
    },
  }).build();

  // Store the final configuration in our state
  setSelfApp(appConfig);
}, [address]); // 🔹 Re-run whenever address prop changes

  // 3. This function is called ONLY on successful verification
  const handleSuccessfulVerification = (attestation: Attestation) => {
    console.log("✅ Verification Successful!", attestation);
    // NEXT STEP: Send 'attestation' to your backend
    console.log("Attestation - ",attestation)
  };

  // 4. This function is called ONLY on failed verification
  const handleFailedVerification = () => {
    console.log("❌ Verification Failed!");
    alert("Verification failed. Please try again.");
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Verify Your Identity</h1>
      <p>Scan the QR code below with the Self mobile app.</p>

      {/* 5. Conditionally render the QR code component */}
      {selfApp ? (
        <SelfQRcodeWrapper
          selfApp={selfApp}
          onSuccess={handleSuccessfulVerification as unknown as () => void}
          onError={handleFailedVerification}
        />
      ) : (
        <div>
          <p>Loading QR Code...</p>
        </div>
      )}
    </div>
  );
}