import { getMockCatalog } from "@tutrain/mock-api";
import { SectionHeading, StateView } from "@tutrain/ui";

export const dynamic = "force-dynamic";

export default function Home() {
  const products = getMockCatalog();
  return <main className="tt-public">
    <header className="tt-public-header"><a className="tt-brand" href="/" aria-label="TuTrain home"><span className="tt-brand-mark">T</span><span>TuTrain</span></a><nav aria-label="Primary"><a href="#programmes">Programmes</a><a href="#how-it-works">How it works</a></nav><a className="tt-button" href="#programmes">Explore learning</a></header>
    <section className="tt-public-intro"><div className="tt-public-intro-copy"><p className="tt-eyebrow">A better way to learn</p><h1>Learning that makes sense, one step at a time.</h1><p>Focused tutoring for every learner, with a clear path from first question to real progress.</p><a className="tt-button" href="#programmes">Explore programmes</a></div><img className="tt-public-photo" src="/focused-student.png" alt="Student studying with a tutor in a library" /></section>
    <section id="programmes" className="tt-public-section"><SectionHeading title="Programmes" detail="Find a focused path for your learner" />{products.length ? <ul className="tt-list">{products.map(product => <li key={product.id}><div><strong>{product.name}</strong><br /><span>{product.market} · {product.slug}</span></div><span className="tt-pill">{new Intl.NumberFormat("en-IN", { style: "currency", currency: product.price.currency }).format(product.price.amount_minor / 100)}</span></li>)}</ul> : <StateView kind="empty" title="Programmes are being prepared" description="Please check back soon for the latest learning options." />}</section>
    <section id="how-it-works" className="tt-public-section"><SectionHeading title="How it works" /><ol className="tt-steps"><li><strong>Choose a path</strong><span>Find a programme for your learner.</span></li><li><strong>Meet your tutor</strong><span>Start with a clear learning plan.</span></li><li><strong>See progress</strong><span>Keep every session connected to the next.</span></li></ol></section>
  </main>;
}
