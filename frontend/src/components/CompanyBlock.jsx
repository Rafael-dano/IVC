export default function CompanyBlock() {
    return (
      <section className="bg-white rounded-xl shadow p-6 space-y-2">
        <h3 className="text-lg font-semibold">Company & Contact</h3>
        <p className="text-sm text-gray-700">
          <strong>IVContent.com</strong><br/>
          San Antonio, Texas, USA 
        </p>
        <p className="text-sm text-gray-700">
          For Support or Privacy: <a className="underline" href="mailto:ivcontent.com@gamil.com">ivcontent.com@gamil.com</a>
        </p>
        <p className="text-xs text-gray-500">
          For legal policies, see the links in the footer (Terms & Privacy).
        </p>
      </section>
    );
  }
  