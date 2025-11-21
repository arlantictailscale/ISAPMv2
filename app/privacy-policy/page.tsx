import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | ISAPM 2026",
  description: "Privacy Policy for the 8th National Meeting of the Indonesian Society of Anesthesiology for Pain Management.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-slate max-w-none">
        <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Welcome to the ISAPM 2026 website ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice or our practices with regard to your personal information, please contact us at admin@isapm2026.org.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us.
          </p>
          <p className="mt-2">
            The personal information that we collect depends on the context of your interactions with us and the website, the choices you make, and the products and features you use. The personal information we collect may include the following:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Names</li>
            <li>Phone numbers</li>
            <li>Email addresses</li>
            <li>Job titles</li>
            <li>Professional credentials</li>
            <li>Billing addresses</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p>
            We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>To facilitate account creation and logon process.</li>
            <li>To send you administrative information.</li>
            <li>To fulfill and manage your orders and registrations.</li>
            <li>To respond to user inquiries/offer support to users.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Sharing Your Information</h2>
          <p>
            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We may process or share your data that we hold based on the following legal basis:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Consent:</strong> We may process your data if you have given us specific consent to use your personal information for a specific purpose.</li>
            <li><strong>Legitimate Interests:</strong> We may process your data when it is reasonably necessary to achieve our legitimate business interests.</li>
            <li><strong>Performance of a Contract:</strong> Where we have entered into a contract with you, we may process your personal information to fulfill the terms of our contract.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Contact Us</h2>
          <p>
            If you have questions or comments about this policy, you may email us at admin@isapm2026.org or by post to:
          </p>
          <address className="mt-4 not-italic">
            Indonesian Society of Anesthesiology for Pain Management<br />
            Batu, Malang<br />
            East Java, Indonesia
          </address>
        </section>
      </div>
    </div>
  )
}
