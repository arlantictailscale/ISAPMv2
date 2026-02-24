import type { Metadata } from "next"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { FileText, Shield, Database, Lock, Trash2, Share2 } from "lucide-react"

export const dynamic = "force-static"
export const revalidate = 86400 // Revalidate once per day

export const metadata: Metadata = {
  title: "Privacy Policy | ISAPM 2026",
  description:
    "Privacy Policy for the 8th National Meeting of the Indonesian Society of Anesthesiology for Pain Management.",
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navigation />

      <section className="relative bg-gradient-to-r from-primary via-primary/90 to-primary pt-24 pb-12">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Privacy Policy</h1>
              <p className="text-white/80 mt-1">ISAPM 8th National Meeting 2026</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-slate max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-900">
              <Shield className="h-5 w-5" />
              Summary of Our Data Practices
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-2">What We Collect</h3>
                <p className="text-gray-700">
                  Name, email, phone, professional credentials, and Google account data (with your consent)
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-2">How We Use It</h3>
                <p className="text-gray-700">
                  Event registration, communication, payment processing, and attendee management
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-2">How We Store It</h3>
                <p className="text-gray-700">
                  Encrypted databases with SSL/TLS, hosted on secure Vercel/Supabase infrastructure
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-2">Your Rights</h3>
                <p className="text-gray-700">
                  Access, correct, delete your data anytime by emailing admin@isapm2026.org
                </p>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to the ISAPM 2026 website ("we," "our," or "us"). We are committed to protecting your personal
              information and your right to privacy. If you have any questions or concerns about this privacy notice or
              our practices with regard to your personal information, please contact us at admin@isapm2026.org.
            </p>
          </section>

          <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              2. DATA COLLECTION - What Information We Collect
            </h2>
            <p className="mb-4">
              We collect personal information that you voluntarily provide to us when you register on the website,
              express an interest in obtaining information about us or our products and services, when you participate
              in activities on the website, or otherwise when you contact us.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">2.1 Information You Provide Directly</h3>
            <p>When you register for our event or use our services, we collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Identity Information:</strong> Full name, professional title, NIK (National ID Number)
              </li>
              <li>
                <strong>Contact Information:</strong> Email address, phone number, mailing address
              </li>
              <li>
                <strong>Professional Information:</strong> Institution/organization, job position, medical credentials
              </li>
              <li>
                <strong>Payment Information:</strong> Billing address, payment confirmation details (we do not store
                credit card numbers)
              </li>
              <li>
                <strong>Event Preferences:</strong> Workshop selections, dietary requirements, hotel booking preferences
              </li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">2.2 Information Collected Automatically</h3>
            <p>When you visit our website, we automatically collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Device Information:</strong> Browser type, operating system, device identifiers
              </li>
              <li>
                <strong>Usage Data:</strong> Pages visited, time spent on pages, click patterns
              </li>
              <li>
                <strong>Log Data:</strong> IP address, access times, referring URLs
              </li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">2.3 Google Account Data (With Your Consent)</h3>
            <p>If you choose to connect your Google account, we access:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Basic Profile:</strong> Your Google account email address and display name for authentication
              </li>
              <li>
                <strong>Google Sheets Data:</strong> For administrators only - event registration data stored in Google
                Sheets for synchronization purposes
              </li>
            </ul>
            <p className="mt-2 text-sm bg-yellow-50 p-3 rounded border border-yellow-200">
              <strong>Important:</strong> We only access Google data with your explicit consent. You can revoke access
              anytime at{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Account Permissions
              </a>
              .
            </p>
          </section>

          <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              3. DATA USAGE - How We Use Your Information
            </h2>
            <p className="mb-4">
              We use your personal information only for legitimate business purposes related to the ISAPM 2026 event.
              Here is exactly how we use each type of data:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300 mt-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-left">Data Type</th>
                    <th className="border border-gray-300 p-3 text-left">How We Use It</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3">Name & Email</td>
                    <td className="border border-gray-300 p-3">
                      Account creation, event registration, sending confirmations and event updates
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Phone Number</td>
                    <td className="border border-gray-300 p-3">
                      Emergency contact during event, WhatsApp notifications (if opted in)
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Professional Info</td>
                    <td className="border border-gray-300 p-3">
                      Verify eligibility for medical professional pricing, generate certificates
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Payment Details</td>
                    <td className="border border-gray-300 p-3">
                      Process registrations, issue invoices, verify payments
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Google Account Data</td>
                    <td className="border border-gray-300 p-3">
                      Authentication only; Sheets access for admin sync purposes
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium mt-6 mb-3">We DO NOT use your data for:</h3>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-red-700">
              <li>Selling to third-party advertisers</li>
              <li>Creating marketing profiles</li>
              <li>Targeted advertising</li>
              <li>Any purpose unrelated to ISAPM 2026 event management</li>
            </ul>
          </section>

          <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              4. DATA STORAGE & SECURITY - How We Protect Your Information
            </h2>
            <p className="mb-4">
              We implement industry-standard security measures to protect your personal information:
            </p>

            <h3 className="text-lg font-medium mt-4 mb-3">4.1 Where Your Data Is Stored</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>Primary Database:</strong> Supabase (PostgreSQL) hosted on secure cloud infrastructure with data
                centers in Southeast Asia
              </li>
              <li>
                <strong>File Storage:</strong> Vercel Blob Storage for payment receipts and documents
              </li>
              <li>
                <strong>Backup Systems:</strong> Encrypted backups stored separately from primary systems
              </li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">4.2 Security Measures</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>Encryption in Transit:</strong> All data transmitted using TLS 1.3 encryption (HTTPS)
              </li>
              <li>
                <strong>Encryption at Rest:</strong> Database encrypted using AES-256 encryption
              </li>
              <li>
                <strong>Access Control:</strong> Role-based access control (RBAC) - only authorized staff can access
                user data
              </li>
              <li>
                <strong>Row Level Security:</strong> Database policies ensure users can only access their own data
              </li>
              <li>
                <strong>OAuth 2.0:</strong> Secure authentication - we never see or store your Google password
              </li>
              <li>
                <strong>Regular Audits:</strong> Periodic security reviews and vulnerability assessments
              </li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">4.3 Password Security</h3>
            <p>
              User passwords are hashed using bcrypt with salt, making them unreadable even to our administrators. We
              never store plain-text passwords.
            </p>
          </section>

          <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              5. DATA SHARING - Who Has Access to Your Information
            </h2>

            <h3 className="text-lg font-medium mt-4 mb-3">5.1 We Share Data With:</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>ISAPM Event Organizers:</strong> Registration details for event management, badge printing, and
                attendance tracking
              </li>
              <li>
                <strong>Hotel Partners (The Singhasari Hotel):</strong> Only if you book accommodation - name, contact,
                booking dates
              </li>
              <li>
                <strong>Service Providers:</strong>
                <ul className="list-circle pl-6 mt-1 space-y-1">
                  <li>Vercel (hosting) - technical infrastructure only</li>
                  <li>Supabase (database) - data storage only</li>
                  <li>Resend (email) - email delivery only</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">5.2 We DO NOT:</h3>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-red-700">
              <li>Sell your personal information to any third party</li>
              <li>Share your data with advertisers or marketing companies</li>
              <li>Transfer your data to countries without adequate data protection</li>
              <li>Use your data for purposes other than event management</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">5.3 Legal Disclosure</h3>
            <p>
              We may disclose your information if required by law, court order, or government regulation, or to protect
              our legal rights.
            </p>
          </section>

          <section className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-primary" />
              6. DATA RETENTION & DELETION - How Long We Keep Your Data
            </h2>

            <h3 className="text-lg font-medium mt-4 mb-3">6.1 Retention Periods</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300 mt-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-left">Data Type</th>
                    <th className="border border-gray-300 p-3 text-left">Retention Period</th>
                    <th className="border border-gray-300 p-3 text-left">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3">Account Information</td>
                    <td className="border border-gray-300 p-3">Until deletion requested or 2 years after event</td>
                    <td className="border border-gray-300 p-3">Account management</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Registration Records</td>
                    <td className="border border-gray-300 p-3">5 years after event</td>
                    <td className="border border-gray-300 p-3">Tax and audit compliance</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Payment Records</td>
                    <td className="border border-gray-300 p-3">7 years after transaction</td>
                    <td className="border border-gray-300 p-3">Financial regulations</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Google API Cache</td>
                    <td className="border border-gray-300 p-3">30 days</td>
                    <td className="border border-gray-300 p-3">Performance optimization</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">Usage Logs</td>
                    <td className="border border-gray-300 p-3">90 days</td>
                    <td className="border border-gray-300 p-3">Security monitoring</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium mt-6 mb-3">6.2 How to Request Data Deletion</h3>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="mb-3">
                You have the right to request deletion of your personal data at any time. To do so:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  <strong>Email us</strong> at{" "}
                  <a href="mailto:admin@isapm2026.org" className="text-primary hover:underline font-semibold">
                    admin@isapm2026.org
                  </a>{" "}
                  with the subject line: <em>"Data Deletion Request"</em>
                </li>
                <li>
                  Include your <strong>registered email address</strong> and specify what data you want deleted
                </li>
                <li>
                  We will <strong>verify your identity</strong> and process your request within <strong>30 days</strong>
                </li>
                <li>
                  You will receive <strong>confirmation</strong> once your data has been deleted
                </li>
              </ol>
            </div>

            <h3 className="text-lg font-medium mt-6 mb-3">6.3 Revoking Google Access</h3>
            <p>
              To immediately revoke our access to your Google account data, visit your{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold"
              >
                Google Account Permissions
              </a>{" "}
              page and remove "ISAPM 2026" from the list of connected apps.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Your Privacy Rights</h2>
            <p>
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Right to Access:</strong> Request a copy of all personal data we hold about you
              </li>
              <li>
                <strong>Right to Rectification:</strong> Request correction of inaccurate personal data
              </li>
              <li>
                <strong>Right to Deletion:</strong> Request deletion of your personal data
              </li>
              <li>
                <strong>Right to Restriction:</strong> Request we limit processing of your personal data
              </li>
              <li>
                <strong>Right to Portability:</strong> Request your data in a machine-readable format
              </li>
              <li>
                <strong>Right to Object:</strong> Object to certain types of processing
              </li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:admin@isapm2026.org" className="text-primary hover:underline">
                admin@isapm2026.org
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Updates to This Policy</h2>
            <p>
              We may update this privacy notice from time to time. The updated version will be indicated by an updated
              "Last updated" date and the updated version will be effective as soon as it is accessible. We encourage
              you to review this privacy notice frequently to be informed of how we are protecting your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Contact Us</h2>
            <p>
              If you have questions or comments about this policy, you may email us at{" "}
              <a href="mailto:admin@isapm2026.org" className="text-primary hover:underline">
                admin@isapm2026.org
              </a>{" "}
              or by post to:
            </p>
            <address className="mt-4 not-italic bg-gray-50 p-4 rounded-lg">
              <strong>Indonesian Society of Anesthesiology for Pain Management</strong>
              <br />
              The Singhasari Hotel & Convention
              <br />
              Batu, Malang
              <br />
              East Java, Indonesia
            </address>
          </section>
        </div>
      </div>

      <Footer />
    </>
  )
}
