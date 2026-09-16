/**
 * Seeds the datastore with demo users + properties matching the
 * Nestora Properties frontend, so the API behaves the same as the old
 * in-memory frontend demo. Safe to run multiple times — it only
 * seeds if the users table is empty.
 */
const bcrypt = require('bcryptjs');
const db = require('./db');

function seed() {
  if (db.users.all().length > 0) {
    console.log('Database already has data — skipping seed. Delete data/db.json to reseed.');
    return;
  }

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const admin = db.users.insert({
    name: 'Nestora Admin', email: 'admin@nestoraproperties.com', password: hash('admin123'),
    phone: '0800-000-0000', role: 'admin', status: 'active', joined: '2024-01-10',
  });
  const agent = db.users.insert({
    name: 'Adaeze Okonkwo', email: 'agent@example.com', password: hash('agent123'),
    phone: '08099887766', role: 'agent', status: 'active', verified: true,
    license: 'REDAN-004821', joined: '2023-11-05',
    photo: '', specialty: 'Luxury Residential Specialist', yearsExperience: 8,
    bio: 'I help buyers and renters find premium homes across Lekki and Victoria Island. 8 years in Lagos real estate with 94 closed sales.',
    idVerification: { status: 'verified', documentType: 'National ID', documentNumber: 'NIN-2281****19', submittedAt: '2023-12-01', reviewedAt: '2023-12-03' },
  });
  const agent2 = db.users.insert({
    name: 'Olumide Kehinde', email: 'agent2@example.com', password: hash('agent123'),
    phone: '08055566677', role: 'agent', status: 'active', verified: true,
    license: 'REDAN-002210', joined: '2024-02-18',
    photo: '', specialty: 'Shortlet & Rental Expert', yearsExperience: 5,
    bio: 'Specialist in shortlet management and rental properties across Lekki and Ikoyi. Fast responses, verified listings only.',
    idVerification: { status: 'pending', documentType: 'International Passport', documentNumber: 'A0****213', submittedAt: '2026-06-30' },
  });
  const newAgent = db.users.insert({
    name: 'Chika Eze', email: 'newagent@example.com', password: hash('agent123'),
    phone: '08133221100', role: 'agent', status: 'active', verified: false,
    license: 'REDAN-009920', joined: '2026-06-28',
    photo: '', specialty: 'Residential Sales', yearsExperience: 2,
    bio: 'Newly onboarded agent covering the Lagos mainland.',
    idVerification: { status: 'none' },
  });
  const buyer = db.users.insert({
    name: 'Kunle Adeyemi', email: 'buyer@example.com', password: hash('buyer123'),
    phone: '08166677788', role: 'buyer', status: 'active', joined: '2025-05-14',
  });

  const listings = [
    { title: '4-Bed Fully Detached Duplex', location: 'Lekki Phase 1, Lagos', price: 85000000, priceStr: '₦85,000,000', badge: 'For Sale', type: 'duplex', beds: 4, baths: 4, area: '320 sqm', parking: 2, img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80', desc: 'A stunning fully detached duplex in Lekki Phase 1 with open-plan kitchen, en-suite bedrooms, rooftop terrace, and serene garden.', tags: ['Swimming Pool', '24/7 Security', 'BQ', 'Generator'], city: 'lagos', lat: 6.4400, lng: 3.4700, status: 'approved', verifiedProperty: true, ownerId: agent.id, ownerType: 'agent' },
    { title: '3-Bed Terrace House', location: 'Chevron Drive, Lekki', price: 45000000, priceStr: '₦45,000,000', badge: 'For Sale', type: 'terrace', beds: 3, baths: 3, area: '210 sqm', parking: 2, img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80', desc: 'Contemporary 3-bedroom terrace with premium finishes.', tags: ['Boys Quarters', 'Generator'], city: 'lagos', lat: 6.4360, lng: 3.5470, status: 'approved', verifiedProperty: false, ownerId: agent2.id, ownerType: 'agent' },
    { title: '2-Bed Luxury Apartment', location: 'Oniru Estate, Victoria Island', price: 4800000, priceStr: '₦4,800,000/yr', badge: 'For Rent', type: 'apartment', beds: 2, baths: 2, area: '120 sqm', parking: 1, img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80', desc: 'Elegant 2-bedroom flat in a premium gated estate on Victoria Island.', tags: ['Gym', 'Pool', 'Ocean View'], city: 'lagos', lat: 6.4270, lng: 3.4460, status: 'approved', verifiedProperty: true, ownerId: agent.id, ownerType: 'agent' },
    { title: '5-Bed Smart Home', location: 'Maitama, Abuja', price: 220000000, priceStr: '₦220,000,000', badge: 'For Sale', type: 'duplex', beds: 5, baths: 6, area: '620 sqm', parking: 4, img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80', desc: 'Architectural masterpiece in Maitama with smart home automation.', tags: ['Smart Home', 'Heated Pool'], city: 'abuja', lat: 9.0930, lng: 7.4980, status: 'approved', verifiedProperty: false, ownerId: agent2.id, ownerType: 'agent' },
    { title: '1-Bed Shortlet Studio', location: 'Ikate, Lekki', price: 45000, priceStr: '₦45,000/night', badge: 'Shortlet', type: 'apartment', beds: 1, baths: 1, area: '65 sqm', parking: 1, img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80', desc: 'Stylishly furnished shortlet apartment managed by a verified Nestora Properties agent, ready for immediate booking.', tags: ['Furnished', 'Netflix', 'Wi-Fi'], city: 'lagos', lat: 6.4460, lng: 3.5150, status: 'approved', verifiedProperty: true, ownerId: agent.id, ownerType: 'agent' },
    { title: '3-Bed Bungalow (Pending Review)', location: 'Yaba, Lagos', price: 38000000, priceStr: '₦38,000,000', badge: 'For Sale', type: 'bungalow', beds: 3, baths: 2, area: '180 sqm', parking: 2, img: 'https://images.unsplash.com/photo-1600047509807-ba8f99d0b845?w=600&q=80', desc: 'Newly submitted listing awaiting admin approval.', tags: ['Good Road'], city: 'lagos', lat: 6.5090, lng: 3.3710, status: 'pending', verifiedProperty: false, ownerId: agent2.id, ownerType: 'agent' },
    { title: '"Too Good To Be True" Waterfront Villa', location: 'Banana Island, Lagos', price: 15000000, priceStr: '₦15,000,000', badge: 'For Sale', type: 'duplex', beds: 6, baths: 6, area: '800 sqm', parking: 5, img: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80', desc: 'Reported by multiple users as a suspected scam listing.', tags: ['Reported'], city: 'lagos', lat: 6.4180, lng: 3.4460, status: 'flagged', verifiedProperty: false, ownerId: agent2.id, ownerType: 'agent' },
  ];

  listings.forEach((l) => db.properties.insert(l));

  db.reviews.insert({ agentId: agent.id, reviewerName: 'Tayo Bello', rating: 5, comment: 'Adaeze was extremely professional and found us the perfect apartment in two weeks.', createdAt: '2026-03-14T10:00:00.000Z' });
  db.reviews.insert({ agentId: agent.id, reviewerName: 'Funmi Alabi', rating: 5, comment: 'Very responsive and honest about property conditions. Highly recommend.', createdAt: '2026-04-02T10:00:00.000Z' });
  db.reviews.insert({ agentId: agent.id, reviewerName: 'Ikenna Obi', rating: 4, comment: 'Good experience overall, viewing scheduling took a little while.', createdAt: '2026-05-20T10:00:00.000Z' });
  db.reviews.insert({ agentId: agent2.id, reviewerName: 'Grace Umoh', rating: 5, comment: 'Booked a shortlet through Olumide, everything was exactly as described.', createdAt: '2026-05-01T10:00:00.000Z' });

  db.leads.insert({
    name: 'Ngozi Umeh', email: 'ngozi.umeh@example.com', phone: '08144455566',
    location: 'Ajah, Lagos', message: 'I want to sell my 3-bedroom flat, please contact me to discuss valuation.',
    status: 'new', createdAt: new Date().toISOString(),
  });

  console.log('Seed complete:');
  console.log('  Admin  -> admin@nestoraproperties.com / admin123');
  console.log('  Agent  -> agent@example.com / agent123 (verified)');
  console.log('  Agent  -> agent2@example.com / agent123 (verified)');
  console.log('  Agent  -> newagent@example.com / agent123 (unverified)');
  console.log('  Buyer  -> buyer@example.com / buyer123');
  console.log(`  ${listings.length} demo properties created.`);
}

seed();
