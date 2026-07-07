import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories } from '../../lib/api/categories';
import { getLocations } from '../../lib/api/locations';
import { LoadingState, ErrorState } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

const VIBE_FILTERS = ['All', 'Trekking', 'Pilgrimage', 'Friends', 'Summer', 'Couple'];

const VIBE_DESTINATIONS = [
  {
    name: 'Chandrashila',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=70',
    desc: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry’s standard dummy text ever since 1966.',
  },
  {
    name: 'Spiti Valley',
    image: 'https://images.unsplash.com/photo-1626016228894-3d0f3f7c1a1a?auto=format&fit=crop&w=600&q=70',
    desc: 'A cold desert at 12,500 feet that looks more like Mars than India. Ancient Buddhist monasteries cling to crumbling cliffs, yaks roam frozen rivers, and the night sky here has no competition. The last frontier before the roof of the world.',
  },
  {
    name: 'Nubra Valley',
    image: 'https://images.unsplash.com/photo-1601922046210-8f2b17e1e5a5?auto=format&fit=crop&w=600&q=70',
    desc: "Where sand dunes meet snow peaks and double-humped Bactrian camels walk beneath the Himalayas. Reached by crossing the world's highest motorable pass — Khardung La — Nubra is a landscape that shouldn't exist, yet does.",
  },
  {
    name: 'Varanasi',
    image: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=600&q=70',
    desc: 'The oldest living city on Earth. Every evening, fire-lit aarti rituals rise from the Ganges ghats in a choreography of devotion unchanged for 3,000 years. Come for the chaos. Stay for the moment it starts to make complete sense.',
  },
  {
    name: 'Rann of Kutchh',
    image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=70',
    desc: "The world's largest salt desert stretches white and endless under a full moon so flat, so vast, it bends your sense of scale. During the Rann Utsav, tribal art, camel silhouettes, and folk music fill a landscape that is otherwise pure silence.",
  },
  {
    name: 'Jodhpur',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=70',
    desc: 'The Blue City. Every rooftop, every alley, every wall painted in a shade of indigo that deepens at dusk. Mehrangarh Fort rises impossibly above it all — one of India’s most dramatic man-made horizons.',
  },
  {
    name: 'Orchha',
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=70',
    desc: 'A medieval town frozen in the 16th century. Cenotaphs rise like ghosts from the Betwa riverbank, Mughal-Rajput palaces stand half-draped in jungle, and temple bells echo through streets where time genuinely forgot to move forward.',
  },
  {
    name: 'Tarkarli Beach',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=70',
    desc: "Maharashtra's answer to the Maldives — crystal-clear Karli river meeting the Arabian Sea, coral reefs visible without a mask, and Sindhudurg Fort rising straight from the ocean. India's most underrated coastal escape, and proud of it.",
  },
  {
    name: 'Lepakshi',
    image: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=600&q=70',
    desc: 'A single hanging pillar that defies gravity. A monolithic Nandi larger than any in India. And ceiling murals so vivid they seem freshly painted inside a 16th-century Vijayanagara temple that most Indians have never heard of, let alone visited.',
  },
  {
    name: 'Kodaikanal',
    image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=600&q=70',
    desc: 'The Princess of Hill Stations — a misty plateau in the Palani Hills at 7,000 feet where the air smells of eucalyptus and pine. Star-shaped Kodai Lake, Pillar Rocks, and silent forest walks that feel like disappearing into a cloud from the inside.',
  },
];

const TRIPS = [
  { title: 'Chaukhamba Sunrise View', vendor: 'BROTRIPS ADV GROUP', location: 'CHANDRASHILA, UTTRAKHAND', duration: '3 days/2 nights', activities: '4+ Activities', rating: 4.2, reviews: 148, priceLow: 6500, priceHigh: 8500, image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=70' },
  { title: 'Where Valleys Collide', vendor: 'ADI KAILASH TOURS', location: 'HAMPTA PASS, HIMACHAL PRADESH', duration: '5 days/4 nights', activities: '16+ Activities', rating: 3.9, reviews: 118, priceLow: 9500, priceHigh: 12500, image: 'https://images.unsplash.com/photo-1626016228894-3d0f3f7c1a1a?auto=format&fit=crop&w=600&q=70' },
  { title: 'Roof of Bengal', vendor: 'WEST BENGAL TOURISM', location: 'SANDAKPHU, WEST BENGAL', duration: '4 days/3 nights', activities: '10+ Activities', rating: 4.6, reviews: 1438, priceLow: 8500, priceHigh: 10000, image: 'https://images.unsplash.com/photo-1626016228894-3d0f3f7c1a1a?auto=format&fit=crop&w=600&q=70' },
  { title: "Nagaland's Secret Garden", vendor: 'BROTRIPS ADV GROUP', location: 'DZOKOU VALLEY, NAGALAND', duration: '3 days/2 nights', activities: '4+ Activities', rating: 4.2, reviews: 108, priceLow: 5500, priceHigh: 8000, image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=600&q=70' },
  { title: "India's Tibetian Touch", vendor: 'BROTRIPS ADV GROUP', location: 'LADAKH, LEH & LADAKH', duration: '11 days/10 nights', activities: '25+ Activities', rating: 4.9, reviews: 178, priceLow: 20000, priceHigh: 25000, image: 'https://images.unsplash.com/photo-1601922046210-8f2b17e1e5a5?auto=format&fit=crop&w=600&q=70' },
  { title: "Asia's Barefoot Paradise", vendor: 'ISLANDS TOUR & PACKAGES', location: 'HAVELOCK ISLAND, ANDAMAN', duration: '7 days/6 nights', activities: '10+ Activities', rating: 3.2, reviews: 18, priceLow: 4500, priceHigh: 7500, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=70' },
  { title: 'Cliffs above Arabian Sea', vendor: 'KERALA TOURISM', location: 'VARKALA BEACH, KERALA', duration: '3 days/2 nights', activities: '8+ Activities', rating: 4.2, reviews: 248, priceLow: 8500, priceHigh: 9500, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=70' },
  { title: "Maharashtra's Coral Secret", vendor: 'MARATHI TOUR & PACKAGES', location: 'TARKARLI, MAHARASHTRA', duration: '3 days/2 nights', activities: '4+ Activities', rating: 4.2, reviews: 178, priceLow: 4500, priceHigh: 6000, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=70' },
  { title: "Arunachal's Emerald Hush", vendor: 'NORTHEASTERN TOURS', location: 'ZIRO VALLEY, ARUNACHAL PRADESH', duration: '3 days/2 nights', activities: '6+ Activities', rating: 4.2, reviews: 148, priceLow: 9500, priceHigh: 10500, image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=600&q=70' },
  { title: 'Chaukhamba Sunrise View', vendor: 'HISTORICAL TOURS', location: 'HAMPI, KARNATAKA', duration: '2 days/1 nights', activities: '4+ Activities', rating: 3.6, reviews: 148, priceLow: 3500, priceHigh: 6500, image: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=600&q=70' },
  { title: 'Where Ganges Remember', vendor: 'SHREE GURU TRAVELS', location: 'VARANASI, UTTAR PRADESH', duration: '3 days/2 nights', activities: '4+ Activities', rating: 4.6, reviews: 148, priceLow: 6500, priceHigh: 8500, image: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=600&q=70' },
  { title: 'Stone stories in Sandstone', vendor: 'KHILJI TRAVELS', location: 'KHAJURAHO, MADHYA PRADESH', duration: '3 days/2 nights', activities: '2+ Activities', rating: 3.2, reviews: 48, priceLow: 6000, priceHigh: 8500, image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=70' },
  { title: 'Monastery in Frozen Earth', vendor: 'TIBETIAN ADV GROUP', location: 'ZANSKAR VALLEY, LADAKH', duration: '5 days/4 nights', activities: '6+ Activities', rating: 4.2, reviews: 548, priceLow: 8500, priceHigh: 12500, image: 'https://images.unsplash.com/photo-1626016228894-3d0f3f7c1a1a?auto=format&fit=crop&w=600&q=70' },
  { title: 'River Island at Dusk', vendor: 'BROTRIPS ADV GROUP', location: 'MAJULI ISLAND, ASSAM', duration: '3 days/2 nights', activities: '4+ Activities', rating: 4.2, reviews: 148, priceLow: 6500, priceHigh: 8500, image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=600&q=70' },
];

const FAQS = [
  {
    q: 'Can I change or cancel my trip after booking?',
    a: 'Yes, We know plans can change. You can easily update or cancel your trip through your account, just make sure to check the flexible date options before confirming.',
  },
  { q: 'Do we offer group travel options?', a: 'Yes, most of our packages support group bookings with per-head pricing and dedicated coordination support.' },
  { q: 'How do I get travel support during my trip?', a: 'Reach us anytime via in-app chat or the enquiries section — our team responds within minutes during your trip.' },
  { q: 'Can I save destinations to plan later?', a: 'Yes, use the wishlist heart icon on any trip card to save it and revisit it anytime from your account.' },
  { q: 'Do we offer special deals or discounts?', a: 'We regularly run seasonal offers and early-bird discounts — subscribe to our newsletter to get notified first.' },
];

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [activeDot, setActiveDot] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeVibe, setActiveVibe] = useState('All');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const locationsQuery = useQuery({ queryKey: ['locations', 'popular'], queryFn: () => getLocations(true) });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/app/search${destination ? `?destination=${encodeURIComponent(destination)}` : ''}`);
  }

  function scrollCarousel(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 300, behavior: 'smooth' });
  }

  function handleScroll() {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = 300;
    setActiveDot(Math.round(el.scrollLeft / cardWidth));
  }

  return (
    <div>
      <section className="hero2">
        <div className="hero2-inner">
          <div className="hero2-tag">TRAVEL MADE SIMPLE&nbsp;&nbsp;-&nbsp;&nbsp;INDIA&rsquo;S BEST TRIPS</div>
          <h1>
            Find your next<br />unforgettable trip
          </h1>
          <p className="hero2-desc">
            {user?.fullName ? `Welcome back, ${user.fullName}. ` : ''}
            Discover hidden gems, hill view chai stalls, ancient trails, and epic skylines, all in one place.
          </p>
          <form className="hero2-cta-row" onSubmit={handleSearch}>
            <input
              placeholder="Where do you want to go?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-pill">Find my Trip</button>
            <Link to="/app/search" className="btn btn-outline btn-pill hero2-explore-btn">
              Explore More
            </Link>
          </form>
          <div className="hero2-trust">Secure booking&nbsp;&nbsp;-&nbsp;&nbsp;No hidden fees&nbsp;&nbsp;-&nbsp;&nbsp;Instant Confirmation</div>
        </div>

        <div className="search-widget">
          <h3 className="search-widget-title">Choose your Destination</h3>
          <div className="search-widget-row">
            <div className="search-widget-field">
              <span className="search-widget-label">From</span>
            </div>
            <div className="search-widget-field">
              <span className="search-widget-label">Upto</span>
            </div>
          </div>
          <div className="search-widget-calendar">
            <div className="search-widget-cal-head">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="search-widget-cal-month">June 2026</div>
            <div className="search-widget-cal-grid">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                <span key={d} className={d === 1 ? 'today' : ''}>{d}</span>
              ))}
            </div>
          </div>
          <div className="search-widget-row">
            <div className="search-widget-field search-widget-stepper">
              <span className="search-widget-label">Adults</span>
              <div className="search-widget-stepper-row">
                <button type="button" onClick={() => setAdults((v) => Math.max(1, v - 1))}>&minus;</button>
                <span>{adults}</span>
                <button type="button" onClick={() => setAdults((v) => v + 1)}>+</button>
              </div>
            </div>
            <div className="search-widget-field search-widget-stepper">
              <span className="search-widget-label">Children</span>
              <div className="search-widget-stepper-row">
                <button type="button" onClick={() => setChildren((v) => Math.max(0, v - 1))}>&minus;</button>
                <span>{children}</span>
                <button type="button" onClick={() => setChildren((v) => v + 1)}>+</button>
              </div>
            </div>
          </div>
          <div className="search-widget-note">*Note: above 18yrs are children</div>
          <button type="button" className="search-widget-cta" onClick={handleSearch}>Find my Destination</button>
        </div>
      </section>

      <div className="site-content">
        <section className="home-section">
          <div className="section-tag2">CURATED FOR YOU</div>
          <h2 className="section-heading">Popular Indian Trips</h2>
          <p className="section-sub2">Discover where travelers are heading this season, from tropical escapes to<br />urban adventures. These trips are stealing the spotlight.</p>

          <div className="carousel-wrap">
            <button className="carousel-arrow prev" onClick={() => scrollCarousel(-1)} aria-label="Previous">‹</button>
            <button className="carousel-arrow next" onClick={() => scrollCarousel(1)} aria-label="Next">›</button>
            <div className="carousel-track" ref={trackRef} onScroll={handleScroll}>
              {TRIPS.map((t, i) => (
                <div className="trip-card-v2" key={`${t.title}-${i}`}>
                  <img src={t.image} alt={t.title} />
                  <div className="trip-card-v2-overlay" />
                  <span className="trip-card-v2-vendor">{t.vendor}</span>
                  <span className="trip-card-v2-location">{t.location}</span>
                  <div className="trip-card-v2-body">
                    <h4>{t.title}</h4>
                    <div className="trip-card-v2-meta">
                      <span>{t.duration}</span>
                      <span>{t.activities}</span>
                      <span className="trip-card-v2-rating">★ {t.rating.toFixed(1)}</span>
                      <span className="trip-card-v2-reviews">( {t.reviews} )</span>
                    </div>
                    <div className="trip-card-v2-footer">
                      <div className="trip-card-v2-price">
                        Rs {t.priceLow.toLocaleString()} - {t.priceHigh.toLocaleString()}/<span>per person</span>
                      </div>
                      <div className="trip-card-v2-actions">
                        <Link to="/app/search" className="trip-card-v2-book">Book</Link>
                        <Link to="/app/search" className="trip-card-v2-explore">Explore</Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="carousel-dots">
              {TRIPS.slice(0, 6).map((_, i) => (
                <span key={i} className={`carousel-dot ${i === activeDot % 6 ? 'active' : ''}`} />
              ))}
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="section-tag2-italic">Travel made simple, stories made unforgettable</div>
          <h2 className="section-heading-big">
            <span>We </span>
            <span className="accent">compare</span>
            <span> and make your plan </span>
            <span className="taupe">effortless</span>
            <span> so you can focus on what really matters</span>
          </h2>
          <div className="value-trio">
            <div className="value-trio-item">
              <div className="value-trio-icon">⚖️</div>
              <h4>Compare prices</h4>
              <p>See every vendor's price side by side before you book.</p>
            </div>
            <div className="value-trio-item">
              <div className="value-trio-icon">📍</div>
              <h4>Verified for travelers</h4>
              <p>Every vendor on NexTTrp is reviewed and verified.</p>
            </div>
            <div className="value-trio-item">
              <div className="value-trio-icon">📅</div>
              <h4>Plan your trip</h4>
              <p>Because every journey deserves a personal touch.</p>
            </div>
            <div className="value-trio-item">
              <div className="value-trio-icon">🎁</div>
              <h4>Book your trip</h4>
              <p>Enjoy exclusive deals and budget-efficient travel offers.</p>
            </div>
          </div>
        </section>

        <div className="value-band">
          <div className="value-item"><strong>30K+</strong><span>Happy explorers who found their dream trips with us</span></div>
          <div className="value-item"><strong>500+</strong><span>Handpicked destinations curated for every kind of traveler and every age of traveler</span></div>
          <div className="value-item"><strong>60%</strong><span>Book your next trip with us and enjoy exclusive deals and have budget-efficient travel deals</span></div>
        </div>

        <section className="home-section">
          <div className="section-tag2">EXPLORE BY VIBE</div>
          <h2 className="section-heading">Discover the world</h2>
          <p className="section-sub2">From thrilling treks to relaxing pilgrimages, curated destinations around the country for every kind of traveler.</p>

          <div className="vibe-pill-row">
            {VIBE_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`vibe-pill ${activeVibe === f ? 'active' : ''}`}
                onClick={() => setActiveVibe(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="vibe-grid">
            {VIBE_DESTINATIONS.map((d) => (
              <Link key={d.name} to={`/app/search?destination=${encodeURIComponent(d.name)}`} className="vibe-card">
                <img src={d.image} alt={d.name} />
                <div className="vibe-card-overlay" />
                <div className="vibe-card-title">{d.name}</div>
                <div className="vibe-card-desc">{d.desc}</div>
                <span className="vibe-card-cta">Check Out</span>
              </Link>
            ))}
          </div>

          <div className="pill-row" style={{ justifyContent: 'center', marginTop: 32 }}>
            {categoriesQuery.data?.data?.map((c) => (
              <Link key={c.id} to={`/app/search?category=${c.name}`} className="pill">
                {c.label ?? c.name}
              </Link>
            ))}
          </div>

          {locationsQuery.isLoading && <LoadingState />}
          {locationsQuery.isError && <ErrorState message="Failed to load destinations" onRetry={() => locationsQuery.refetch()} />}

          <div className="discover-strip" style={{ marginTop: 20 }}>
            {locationsQuery.data?.data?.map((loc) => (
              <Link key={loc.id} to={`/app/search?destination=${encodeURIComponent(loc.city)}`} className="discover-card">
                {loc.image_url ? (
                  <img src={loc.image_url} alt={loc.city} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1A1A2E,#2D2D4E)' }} />
                )}
                <span className="discover-card-label">{loc.city}{loc.state ? `, ${loc.state}` : ''}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="home-section">
          <div className="section-tag2">Real stories from Real travelers</div>
          <h2 className="section-heading">Moments that made every journey unforgettable</h2>
          <div className="testimonial-band">
            <h3>Trusted by thousands of travelers around the country</h3>
            <Link to="/app/search" className="btn testimonial-cta">See more happiness</Link>
          </div>
        </section>

        <section className="home-section">
          <div className="section-tag2">Frequently Asked Questions</div>
          <p className="section-sub2">Got questions before your next trip? We&rsquo;ve got you covered here&rsquo;s everything you need to know about using it.</p>

          <div className="faq-list">
            {FAQS.map((item, i) => (
              <div key={item.q} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-item-head"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  {item.q}
                  <span className="faq-item-toggle">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <div className="faq-item-body">{item.a}</div>}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link to="/app/enquiries" className="btn more-questions-cta">More Questions?</Link>
          </div>
        </section>

        <div className="cta-banner">
          <h2>Book faster with us for your Next Trip</h2>
          <p>Grab your exclusive offer before it&rsquo;s gone&nbsp;&nbsp;Simply login, pick your destination, and unlock your crazy deals on selected trips</p>
          <Link to="/app/search" className="btn cta-banner-cta">Book my Trip Now</Link>
        </div>
      </div>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <span className="site-footer-logo-mark">N</span>
            <h4>NexTTrp</h4>
            <p>We make travel planning seamless and travel booking easier and faster, so that you can get more time for packing.</p>
          </div>
          <div>
            <h4>Explore</h4>
            <Link to="/app/search">Destinations</Link>
            <Link to="/app/search">Experiences</Link>
            <Link to="/app/search">Travel Dates</Link>
            <Link to="/app/wishlist">Favourite Trip</Link>
            <Link to="/app/search">Package</Link>
            <Link to="/app/search">Guides</Link>
          </div>
          <div>
            <h4>Support</h4>
            <Link to="/app/search">About Us</Link>
            <Link to="/app/search">Our Partners</Link>
            <Link to="/app/enquiries">Contact Us</Link>
            <Link to="/app/enquiries">FAQs</Link>
          </div>
          <div>
            <h4>Stay in the loop</h4>
            <p>Get travel inspo, exclusive deals, and the latest updates<br />startight to your inbox.</p>
            <form className="site-footer-newsletter" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your Email address" required />
              <button type="submit" className="btn btn-primary">Subscribe</button>
            </form>
          </div>
        </div>
        <div className="site-footer-bottom">© {new Date().getFullYear()} NexTTrp. All rights reserved.</div>
      </footer>
    </div>
  );
}
