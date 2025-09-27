import { TenderRegistrationForm } from "@/components/tender-registration-form"

export default function RegisterPage() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="sr-only">Register New Tender</h1>
      <TenderRegistrationForm />
    </main>
  )
}
