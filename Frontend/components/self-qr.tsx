"use client";
import { useEffect, useState } from "react";
import {
  SelfAppBuilder,
  countries,
} from "@selfxyz/qrcode";
import "dotenv/config";
import {SelfQRcodeWrapper} from "@selfxyz/qrcode"
import { useRouter } from "next/navigation";

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
const ENDPOINT = process.env.ENDPOINT+"/verify";
// const ENDPOINT = "";
type VerificationPageProps = {
  address: string
}
export default function VerificationPage({ address }: VerificationPageProps) {
  // 1. State to hold the configuration object for the QR code
  const [selfApp, setSelfApp] = useState<any>(null);
  const router = useRouter()
  // 2. This effect runs once to build the verification configuration


  useEffect(() => {
  if (!address) {
    setSelfApp(null);
    return;
  }

  try {
    // Build the QR code configuration dynamically based on the current address
    const appConfig: SelfAppConfig = new SelfAppBuilder({
      version: 2,
      appName: "My Basic Verification App",
      scope: "scope",
      userId: address,       // use the latest address
      userIdType: "hex",
      endpoint: ENDPOINT,
      logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
      disclosures: {
        minimumAge: 15,
        excludedCountries: [countries.PAKISTAN],
        nationality: true,
        gender: true,
      },
    }).build();

      setSelfApp(appConfig);
    } catch (err) {
      console.error("Failed to build SelfApp config:", err);
      setSelfApp(null);
    }
  }, [address]);

  // 3. This function is called ONLY on successful verification
  const handleSuccessfulVerification = (attestation: Attestation) => {
    console.log("✅ Verification Successful!", attestation);
    // NEXT STEP: Send 'attestation' to your backend
    console.log("Attestation - ", attestation)
    router.push("/")
  };

  // 4. This function is called ONLY on failed verification
  const handleFailedVerification = () => {
    console.log("❌ Verification Failed!");
    alert("Verification failed. Please try again.");
    router.push("/signup")
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
          onError={handleFailedVerification as unknown as () => void}
        />
      ) : (
        <div>
          <p>Loading QR Code...</p>
        </div>
      )}
    </div>
  );
}
