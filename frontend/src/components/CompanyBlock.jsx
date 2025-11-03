import "./CompanyBlock.css";

export default function CompanyBlock() {
  return (
    <section className="surface-card surface-card--subtle company-block">
      <h3 className="company-block__title">Company &amp; Contact</h3>
      <p className="muted-text">
        <strong>IVContent.com</strong>
        <br />
        San Antonio, Texas, USA
      </p>
      <p className="muted-text">
        For Support or Privacy: <a className="link-cta" href="mailto:ivcontent.com@gamil.com">ivcontent.com@gmail.com</a>
      </p>
      <p className="company-block__note">
        For legal policies, see the links in the footer (Terms &amp; Privacy).
      </p>
    </section>
  );
}
  