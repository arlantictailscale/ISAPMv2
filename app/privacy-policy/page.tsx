import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | ISAPM 2026",
  description:
    "Privacy Policy for the 8th National Meeting of the Indonesian Society of Anesthesiology for Pain Management.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-slate max-w-none">
        <p className="text-muted-foreground mb-6">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Welcome to the ISAPM 2026 website ("we," "our," or "us"). We are committed to protecting your personal
            information and your right to privacy. If you have any questions or concerns about this privacy notice or
            our practices with regard to your personal information, please contact us at admin@isapm2026.org.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when you register on the website, express
            an interest in obtaining information about us or our products and services, when you participate in
            activities on the website, or otherwise when you contact us.
          </p>
          <p className="mt-2">
            The personal information that we collect depends on the context of your interactions with us and the
            website, the choices you make, and the products and features you use. The personal information we collect
            may include the following:
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
          <h2 className="text-xl font-semibold mb-4">3. Google User Data</h2>
          <p className="mb-4">
            Our application integrates with Google services to enhance your experience. This section describes how we
            handle Google user data in compliance with Google API Services User Data Policy.
          </p>

          <h3 className="text-lg font-medium mt-6 mb-3">3.1 Data Accessed</h3>
          <p>
            When you connect your Google account to our application, we may access the following types of Google user
            data:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Google Sheets Data:</strong> We access Google Sheets to synchronize attendee registration data for
              event management purposes.
            </li>
            <li>
              <strong>Basic Profile Information:</strong> Your Google account email address and name for authentication
              purposes.
            </li>
          </ul>

          <h3 className="text-lg font-medium mt-6 mb-3">3.2 Data Usage</h3>
          <p>We use the Google user data we access for the following specific purposes:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Event Registration Management:</strong> To sync and manage attendee registrations, payment
              confirmations, and event access across our systems.
            </li>
            <li>
              <strong>Administrative Functions:</strong> To enable authorized administrators to manage event data
              efficiently through Google Sheets integration.
            </li>
            <li>
              <strong>Communication:</strong> To send event-related communications and confirmations to registered
              attendees.
            </li>
          </ul>
          <p className="mt-2">
            We do not use Google user data for advertising purposes or to create user profiles for marketing. The data
            is used solely for the operational purposes described above.
          </p>

          <h3 className="text-lg font-medium mt-6 mb-3">3.3 Data Sharing</h3>
          <p>We are committed to protecting your Google user data and limit sharing as follows:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>No Third-Party Sales:</strong> We do not sell, rent, or trade your Google user data to any third
              parties.
            </li>
            <li>
              <strong>Service Providers:</strong> We may share data with trusted service providers (such as Vercel for
              hosting, Supabase for database services) who assist us in operating our website, conducting our business,
              or serving our users. These parties are bound by confidentiality agreements and are prohibited from using
              your data for any other purpose.
            </li>
            <li>
              <strong>Legal Requirements:</strong> We may disclose your data if required by law, court order, or
              governmental regulation.
            </li>
            <li>
              <strong>Event Organizers:</strong> Relevant registration information may be shared with ISAPM 2026 event
              organizers solely for event management purposes.
            </li>
          </ul>

          <h3 className="text-lg font-medium mt-6 mb-3">3.4 Data Storage & Protection</h3>
          <p>We implement robust security measures to protect your Google user data:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Encryption:</strong> All data is transmitted using SSL/TLS encryption (HTTPS) and stored in
              encrypted databases.
            </li>
            <li>
              <strong>Access Control:</strong> Access to Google user data is restricted to authorized personnel only,
              using role-based access controls.
            </li>
            <li>
              <strong>Secure Infrastructure:</strong> Our application is hosted on Vercel's secure infrastructure with
              enterprise-grade security measures.
            </li>
            <li>
              <strong>Database Security:</strong> User data is stored in Supabase with Row Level Security (RLS) policies
              to ensure data isolation and protection.
            </li>
            <li>
              <strong>Regular Audits:</strong> We conduct regular security reviews to identify and address potential
              vulnerabilities.
            </li>
            <li>
              <strong>OAuth 2.0:</strong> We use Google's secure OAuth 2.0 protocol for authentication, ensuring we
              never have access to your Google password.
            </li>
          </ul>

          <h3 className="text-lg font-medium mt-6 mb-3">3.5 Data Retention & Deletion</h3>
          <p>We retain Google user data only for as long as necessary:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Active Use Period:</strong> Data is retained while you maintain an active account and during the
              ISAPM 2026 event period.
            </li>
            <li>
              <strong>Post-Event Retention:</strong> Registration and attendance records may be retained for up to 2
              years after the event for administrative and compliance purposes.
            </li>
            <li>
              <strong>Automatic Deletion:</strong> Cached Google API data is automatically purged after 30 days of
              inactivity.
            </li>
          </ul>
          <p className="mt-4">
            <strong>Your Rights - Data Deletion Request:</strong>
          </p>
          <p>You have the right to request deletion of your Google user data at any time. To request deletion:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              Email us at{" "}
              <a href="mailto:admin@isapm2026.org" className="text-primary hover:underline">
                admin@isapm2026.org
              </a>{" "}
              with the subject line "Google Data Deletion Request"
            </li>
            <li>Include your registered email address and specify what data you want deleted</li>
            <li>We will process your request within 30 days and confirm deletion via email</li>
          </ul>
          <p className="mt-2">
            You may also revoke our application's access to your Google account at any time through your{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Account Permissions
            </a>{" "}
            page.
          </p>
        </section>
        {/* End of Google User Data section */}

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. How We Use Your Information</h2>
          <p>
            We use personal information collected via our website for a variety of business purposes described below. We
            process your personal information for these purposes in reliance on our legitimate business interests, in
            order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal
            obligations.
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>To facilitate account creation and logon process.</li>
            <li>To send you administrative information.</li>
            <li>To fulfill and manage your orders and registrations.</li>
            <li>To respond to user inquiries/offer support to users.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Sharing Your Information</h2>
          <p>
            We only share information with your consent, to comply with laws, to provide you with services, to protect
            your rights, or to fulfill business obligations. We may process or share your data that we hold based on the
            following legal basis:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Consent:</strong> We may process your data if you have given us specific consent to use your
              personal information for a specific purpose.
            </li>
            <li>
              <strong>Legitimate Interests:</strong> We may process your data when it is reasonably necessary to achieve
              our legitimate business interests.
            </li>
            <li>
              <strong>Performance of a Contract:</strong> Where we have entered into a contract with you, we may process
              your personal information to fulfill the terms of our contract.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Data Security</h2>
          <p>
            We have implemented appropriate technical and organizational security measures designed to protect the
            security of any personal information we process. However, despite our safeguards and efforts to secure your
            information, no electronic transmission over the Internet or information storage technology can be
            guaranteed to be 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Your Privacy Rights</h2>
          <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>The right to access your personal data</li>
            <li>The right to rectify inaccurate personal data</li>
            <li>The right to request deletion of your personal data</li>
            <li>The right to restrict processing of your personal data</li>
            <li>The right to data portability</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, please contact us at{" "}
            <a href="mailto:admin@isapm2026.org" className="text-primary hover:underline">
              admin@isapm2026.org
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Updates to This Policy</h2>
          <p>
            We may update this privacy notice from time to time. The updated version will be indicated by an updated
            "Last updated" date and the updated version will be effective as soon as it is accessible. We encourage you
            to review this privacy notice frequently to be informed of how we are protecting your information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Contact Us</h2>
          <p>
            If you have questions or comments about this policy, you may email us at admin@isapm2026.org or by post to:
          </p>
          <address className="mt-4 not-italic">
            Indonesian Society of Anesthesiology for Pain Management
            <br />
            Batu, Malang
            <br />
            East Java, Indonesia
          </address>
        </section>
      </div>
    </div>
  )
}
