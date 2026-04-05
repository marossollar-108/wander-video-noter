"use client";

export default function LandingPage() {
  return (
    <>
      <style>{`
        .landing *,.landing *::before,.landing *::after{margin:0;padding:0;box-sizing:border-box}
        .landing{
          --lbg:#0a0a0a;
          --lsurface:#111111;
          --lsurface2:#1a1a1a;
          --lborder:#222;
          --ltext:#e8e8e8;
          --ltext-dim:#888;
          --laccent:#EB002F;
          --laccent-glow:rgba(235,0,47,0.15);
          --laccent-subtle:rgba(235,0,47,0.08);
          --lfont-display:'Outfit',sans-serif;
          --lfont-mono:'JetBrains Mono',monospace;
          background:var(--lbg);color:var(--ltext);font-family:var(--lfont-display);line-height:1.6;
          min-height:100vh;
        }
        .landing ::selection{background:var(--laccent);color:#fff}

        .lnav{position:fixed;top:0;left:0;right:0;z-index:100;padding:1rem 2rem;display:flex;align-items:center;justify-content:space-between;backdrop-filter:blur(20px);background:rgba(10,10,10,0.8);border-bottom:1px solid var(--lborder)}
        .lnav-brand{display:flex;align-items:center;gap:.6rem;text-decoration:none;color:var(--ltext)}
        .lnav-brand img{height:32px}
        .lnav-brand span{font-family:var(--lfont-display);font-weight:700;font-size:1rem;letter-spacing:-.01em}
        .lnav-brand em{font-style:italic;color:var(--laccent);font-weight:800}
        .lnav-links{display:flex;gap:1.5rem;align-items:center}
        .lnav-links a{color:var(--ltext-dim);text-decoration:none;font-size:.85rem;font-weight:500;transition:color .2s}
        .lnav-links a:hover{color:var(--laccent)}

        .lhero{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:8rem 2rem 4rem;position:relative;overflow:hidden;background:url('/landing/hero-bg.png') center top / cover no-repeat}
        .lhero::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.85) 40%, var(--lbg) 100%);pointer-events:none}
        .lhero>*{position:relative;z-index:1}
        .lhero-badges{display:flex;gap:.75rem;flex-wrap:wrap;justify-content:center;margin-bottom:2rem;opacity:0;animation:lfadeUp .8s .2s forwards}
        .lbadge{font-family:var(--lfont-mono);font-size:.7rem;padding:.35rem .8rem;border:1px solid var(--lborder);border-radius:100px;color:var(--ltext-dim);letter-spacing:.05em;text-transform:uppercase;background:var(--lsurface)}
        .lbadge.accent{border-color:var(--laccent);color:var(--laccent);background:var(--laccent-subtle)}
        .lhero h1{font-size:clamp(2.5rem,6vw,5rem);font-weight:900;line-height:1.05;max-width:800px;letter-spacing:-.04em;opacity:0;animation:lfadeUp .8s .4s forwards}
        .lhero h1 em{font-style:italic;color:var(--laccent)}
        .lhero-quote{max-width:650px;margin:1.5rem auto 2.5rem;font-size:1rem;color:var(--ltext-dim);line-height:1.7;border-left:3px solid var(--laccent);padding-left:1.25rem;text-align:left;opacity:0;animation:lfadeUp .8s .6s forwards}
        .lhero-cta{display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;opacity:0;animation:lfadeUp .8s .8s forwards}
        .lbtn{display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.8rem;font-family:var(--lfont-mono);font-size:.8rem;font-weight:600;border-radius:8px;text-decoration:none;transition:all .25s;letter-spacing:.03em;cursor:pointer;border:none}
        .lbtn-primary{background:var(--laccent);color:#fff}
        .lbtn-primary:hover{background:#ff1a3d;transform:translateY(-2px);box-shadow:0 8px 30px rgba(235,0,47,0.3)}
        .lbtn-outline{background:transparent;color:var(--ltext);border:1px solid var(--lborder)}
        .lbtn-outline:hover{border-color:var(--laccent);color:var(--laccent);transform:translateY(-2px)}

        .lmarquee{padding:2rem 0;border-top:1px solid var(--lborder);border-bottom:1px solid var(--lborder);overflow:hidden;background:var(--lsurface)}
        .lmarquee-track{display:flex;gap:2rem;animation:lscroll 25s linear infinite;width:max-content}
        .lmarquee-item{font-family:var(--lfont-mono);font-size:.8rem;color:var(--ltext-dim);white-space:nowrap;padding:.4rem 1rem;border:1px solid var(--lborder);border-radius:100px;background:var(--lsurface2)}
        .lmarquee-item.hl{color:var(--laccent);border-color:rgba(235,0,47,0.3)}
        @keyframes lscroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

        .lsection{padding:5rem 2rem}
        .lsection-label{font-family:var(--lfont-mono);font-size:.75rem;color:var(--ltext-dim);letter-spacing:.1em;text-transform:uppercase;margin-bottom:1rem}
        .lsection-label span{color:var(--laccent)}
        .lsection-title{font-size:clamp(1.8rem,4vw,3rem);font-weight:800;letter-spacing:-.03em;margin-bottom:1.5rem;max-width:600px;color:var(--ltext)}
        .lsection-title em{font-style:italic;color:var(--laccent)}
        .lsection-text{color:var(--ltext-dim);max-width:650px;line-height:1.8;font-size:1rem}

        .lfeatures-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;max-width:1000px;margin:2.5rem auto 0}
        .lfeature-card{padding:2rem;border:1px solid var(--lborder);border-radius:16px;background:var(--lsurface);transition:all .3s;position:relative;overflow:hidden}
        .lfeature-card:hover{border-color:rgba(235,0,47,0.3);transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.3)}
        .lfeature-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--laccent),transparent);opacity:0;transition:opacity .3s}
        .lfeature-card:hover::before{opacity:1}
        .lfeature-num{font-family:var(--lfont-mono);font-size:.7rem;color:var(--laccent);margin-bottom:1rem;letter-spacing:.05em}
        .lfeature-card h3{font-size:1.15rem;font-weight:700;margin-bottom:.6rem;letter-spacing:-.01em;color:var(--ltext)}
        .lfeature-card p{color:var(--ltext-dim);font-size:.9rem;line-height:1.6}

        .lorigin-section{max-width:800px;margin:0 auto}
        .lorigin-quote{font-size:1.1rem;line-height:1.8;color:var(--ltext);padding:2rem;border:1px solid var(--lborder);border-radius:16px;background:var(--lsurface);position:relative}
        .lorigin-quote::before{content:'"';position:absolute;top:-.5rem;left:1rem;font-size:4rem;color:var(--laccent);font-family:Georgia,serif;line-height:1;opacity:.5}
        .lorigin-author{margin-top:1rem;font-family:var(--lfont-mono);font-size:.8rem;color:var(--ltext-dim)}

        .lfooter{padding:3rem 2rem;border-top:1px solid var(--lborder);text-align:center}
        .lfooter-brand{font-family:var(--lfont-display);font-weight:800;font-size:1rem;letter-spacing:.05em;text-transform:uppercase;color:var(--ltext-dim);margin-bottom:.5rem}
        .lfooter-sub{font-size:.8rem;color:var(--ltext-dim);font-style:italic;margin-bottom:1rem}
        .lfooter-copy{font-family:var(--lfont-mono);font-size:.7rem;color:#555}

        @keyframes lfadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

        @media(max-width:768px){
          .lnav{padding:.75rem 1rem}
          .lnav-links{display:none}
          .lhero{padding:7rem 1.25rem 3rem}
          .lsection{padding:3rem 1.25rem}
          .lfeatures-grid{grid-template-columns:1fr}
        }
      `}</style>

      <div className="landing">
        {/* NAV */}
        <nav className="lnav">
          <a href="#" className="lnav-brand">
            <img src="/logo-dark.svg" alt="Wander" />
            <span>Wander <em>VIDEO NOTER</em></span>
          </a>
          <div className="lnav-links">
            <a href="#about">O aplikacii</a>
            <a href="#features">Funkcie</a>
            <a href="/galeria">Galeria</a>
            <a href="#origin">Pribeh</a>
            <a href="https://github.com/marossollar-108/wander-video-noter" target="_blank" rel="noopener">Zdrojovy kod</a>
          </div>
        </nav>

        {/* HERO */}
        <section className="lhero">
          <div className="lhero-badges">
            <span className="lbadge accent">Video poznamkovac</span>
            <span className="lbadge">Open Source</span>
            <span className="lbadge">Vibe Coded</span>
          </div>
          <h1>Nepocul si obrazok?<br />Mozes ho <em>uvidiet!</em></h1>
          <blockquote className="lhero-quote">
            Dlhsie ma velmi trapilo, ked som dostal nejaky odkaz na video prednasku, tak ze si ju vypocujem v aute, ale potom zistujem, fuha, je tam kopec obrazkov a bez nich to casto nebolo ono. Tak som si spravil takuto appku — z toho videa vygeneruje HTML stranku so sumarizaciou aj s tymi obrazkami.
          </blockquote>
          <div className="lhero-cta">
            <a href="/dashboard" className="lbtn lbtn-primary">./OTVORIT-APPKU</a>
            <a href="https://github.com/marossollar-108/wander-video-noter" className="lbtn lbtn-outline" target="_blank" rel="noopener">./ZDROJOVY-KOD</a>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="lmarquee">
          <div className="lmarquee-track">
            {["Video poznamkovac", "Open Source", "Vibe Coded", "HTML vystup", "LLM sumarizacia", "Extrakcia obrazkov", "Vlastny API kluc", "Jednoduchy a rychly"].flatMap((text, i) => [
              <span key={`a${i}`} className={`lmarquee-item${i % 2 === 0 ? " hl" : ""}`}>{text}</span>,
              <span key={`b${i}`} className={`lmarquee-item${i % 2 === 0 ? " hl" : ""}`}>{text}</span>,
            ])}
          </div>
        </div>

        {/* ABOUT */}
        <section className="lsection" id="about" style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="lsection-label">// o aplikacii</div>
          <h2 className="lsection-title">Co robi <em>Video Noter?</em></h2>
          <p className="lsection-text">
            Wander Video Noter je open source nastroj, ktory z videovej prednasky alebo prezentacie vygeneruje prehladnu HTML stranku. Stranka obsahuje sumarizaciu obsahu aj s extrahovanyni obrazkami — takze aj ked si video iba pocuvas, nic ti neunikne. Je to open source, ale potrebujes svoj API kluc na nejaky LLM model.
          </p>
        </section>

        {/* FEATURES */}
        <section className="lsection" id="features" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center" }}>
            <div className="lsection-label">// funkcie</div>
            <h2 className="lsection-title" style={{ margin: "0 auto 1rem" }}>Jedna appka. <em>Vsetky poznamky.</em></h2>
          </div>
          <div className="lfeatures-grid">
            {[
              { num: "01", title: "Video → HTML", desc: "Nahras video alebo odkaz a dostanes prehladnu HTML stranku so sumarizaciou a obrazkami. Jednoducho a rychlo." },
              { num: "02", title: "Extrakcia obrazkov", desc: "Appka automaticky extrahuje klucove obrazky z videa, aby si nemusel/a video znova prezerat kvoli grafom a diagramom." },
              { num: "03", title: "LLM Sumarizacia", desc: "Obsah videa je spracovany pomocou LLM modelu, ktory vytvori prehladne a zrozumitelne poznamky z celej prednasky." },
              { num: "04", title: "Vlastny API kluc", desc: "Pouzivaas vlastny API kluc na LLM model — mas plnu kontrolu nad nakladmi aj nad tym, aky model pouzijes." },
              { num: "05", title: "Open Source", desc: "Cely kod je otvoreny na GitHube. Pouzi ho, uprav, vylepsi — je to tvoje. Ziadne skryte poplatky." },
              { num: "06", title: "Vibe Coded", desc: "Postavene z frustracie a lasky k jednoduchosti. Cela appka vznikla pomocou AI a vibe codingu — dokaz, ze mysliet staci." },
            ].map((f) => (
              <div key={f.num} className="lfeature-card">
                <div className="lfeature-num">{f.num}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ORIGIN */}
        <section className="lsection" id="origin">
          <div className="lorigin-section">
            <div className="lsection-label">// pribeh</div>
            <h2 className="lsection-title">Preco <em>vznikol?</em></h2>
            <div className="lorigin-quote">
              Dlhsie ma velmi trapilo, ked som dostal nejaky odkaz na video prednasku, tak ze si ju vypocujem v aute, ale potom zistujem, fuha, je tam kopec obrazkov a bez nich to casto nebolo ono. Tak som si spravil takuto appku — z toho videa vygeneruje HTML stranku so sumarizaciou aj s tymi obrazkami. Je to open source, ale potrebujes svoj API kluc na nejaky LLM model.
              <div className="lorigin-author">— Maros Sollar, tvorca Wander Video Noter</div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lfooter">
          <div className="lfooter-brand">WANDER DOMAIN</div>
          <div className="lfooter-sub">aplikacie pre digitalnych tulakov</div>
          <div className="lfooter-copy">&copy; 2026 Wander Domain &middot; Vyrobene s ☕ a Claude</div>
        </footer>
      </div>
    </>
  );
}
