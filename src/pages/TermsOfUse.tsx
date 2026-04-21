import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-[#f4f7f9] pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Terms of Use for Onusandhan.in</h1>
        <p className="text-slate-500 mb-8 italic">Last Updated: April 21, 2026</p>

        <div className="space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">1. Acceptance of Terms</h2>
            <p className="mb-4">
              Welcome to Onusandhan (<a href="https://onusandhan.in/" className="text-indigo-600 hover:text-indigo-800 underline">https://onusandhan.in/</a>). By accessing or using this website, you agree to comply with and be bound by these Terms of Use.
            </p>
            <p>If you do not agree with these terms, please do not use the website.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">2. About the Platform</h2>
            <p className="mb-4">Onusandhan is an academic and research-oriented platform designed for:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Students</li>
              <li>Research scholars</li>
              <li>Institutions</li>
              <li>Authors and academic professionals</li>
            </ul>
            <p className="mb-2">The platform may provide services such as:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Academic support and documentation</li>
              <li>Research-related resources</li>
              <li>Booking sessions or consultations</li>
              <li>Content sharing and knowledge dissemination</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">3. User Responsibilities</h2>
            <p className="mb-2">By using this website, you agree that you will:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Provide accurate and complete information</li>
              <li>Use the website only for lawful purposes</li>
              <li>Not misuse, copy, or exploit content without permission</li>
              <li>Not engage in harmful activities such as hacking, spamming, or data scraping</li>
            </ul>
            <p className="font-semibold text-slate-800">You are responsible for maintaining the confidentiality of any account or login details.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">4. Intellectual Property Rights</h2>
            <p className="mb-2">All content on this website, including:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Text</li>
              <li>Graphics</li>
              <li>Logos</li>
              <li>Videos</li>
              <li>Documents</li>
            </ul>
            <p className="mb-4">is the property of Onusandhan or its licensors and is protected by intellectual property laws.</p>
            <p className="mb-2">You may not:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Copy, reproduce, or distribute content without permission</li>
              <li>Use content for commercial purposes without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">5. User-Submitted Content</h2>
            <p className="mb-2">If you submit any content (forms, documents, research material, etc.):</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>You grant us the right to use it for providing services</li>
              <li>You confirm that the content is original and lawful</li>
              <li>You agree not to submit confidential or copyrighted material without permission</li>
            </ul>
            <p className="font-semibold text-slate-800">We are not responsible for misuse of user-submitted content outside our control.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">6. Booking and Communication</h2>
            <p className="mb-2">When you book a session or submit a request:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You agree to provide correct contact details</li>
              <li>You may receive confirmations via email or WhatsApp</li>
              <li>We reserve the right to accept or reject any booking</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">7. Payments and Refunds (if applicable)</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>All payments (if any) must be made through approved methods</li>
              <li>Fees once paid may be non-refundable unless stated otherwise</li>
              <li>Any disputes must be raised within a reasonable time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">8. Third-Party Services</h2>
            <p className="mb-2">Our website may use or link to third-party services such as:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Payment gateways</li>
              <li>Analytics tools</li>
              <li>Communication platforms (e.g., WhatsApp API)</li>
            </ul>
            <p>We are not responsible for the policies or practices of third-party services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">9. Limitation of Liability</h2>
            <p className="mb-2">Onusandhan shall not be held liable for:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Any direct or indirect damages arising from use of the website</li>
              <li>Loss of data, business, or opportunities</li>
              <li>Errors, interruptions, or technical issues</li>
            </ul>
            <p className="font-semibold text-slate-800">Use of the website is at your own risk.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">10. Disclaimer</h2>
            <p className="mb-4">The information and services provided on this website are for academic and informational purposes only.</p>
            <p className="mb-2">We do not guarantee:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Accuracy or completeness of content</li>
              <li>Specific academic or professional outcomes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">11. Privacy</h2>
            <p>
              Your use of the website is also governed by our Privacy Policy. <br />
              Please review it here: <Link to="/privacy-policy" className="text-indigo-600 hover:text-indigo-800 underline">Privacy Policy</Link>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">12. Termination of Access</h2>
            <p className="mb-2">We reserve the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Suspend or terminate access to the website</li>
              <li>Restrict services without prior notice</li>
            </ul>
            <p className="font-semibold text-slate-800">if users violate these Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">13. Changes to Terms</h2>
            <p className="mb-2">We may update these Terms at any time.</p>
            <p>Continued use of the website means you accept the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">14. Governing Law</h2>
            <p className="mb-4">These Terms shall be governed by the laws of India.</p>
            <p>Any disputes shall be subject to the jurisdiction of courts in Kolkata, West Bengal.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">15. Contact Information</h2>
            <p className="mb-2">For any queries regarding these Terms, contact:</p>
            <ul className="list-none space-y-1">
              <li><strong>Email:</strong> <a href="mailto:bcicomputerpoint@gmail.com" className="text-indigo-600 hover:text-indigo-800 underline">bcicomputerpoint@gmail.com</a></li>
              <li><strong>Website:</strong> <a href="https://onusandhan.in/" className="text-indigo-600 hover:text-indigo-800 underline">https://onusandhan.in/</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">16. Academic Integrity</h2>
            <p className="mb-2">Users must ensure that any research or academic work supported through this platform:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Follows ethical guidelines</li>
              <li>Avoids plagiarism</li>
              <li>Is used responsibly</li>
            </ul>
          </section>
        </div>
      </div>
      
      <footer className="mt-16 pb-8 w-full text-center text-sm text-slate-500 border-t border-slate-200 pt-8 max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-2">
        <span>Developed by Online Academy, Contact - <a href="mailto:bcicomputerpoint@gmail.com" className="hover:text-indigo-600 transition-colors">bcicomputerpoint@gmail.com</a></span>
        <span className="text-slate-300">|</span>
        <Link to="/privacy-policy" className="hover:text-indigo-600 transition-colors font-medium">Privacy Policy</Link>
        <span className="text-slate-300">|</span>
        <Link to="/terms-of-use" className="hover:text-indigo-600 transition-colors font-medium">Terms of Use</Link>
      </footer>
    </div>
  );
}
