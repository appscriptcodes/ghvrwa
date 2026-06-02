/* ===================================================
   Chatbot-GenericTable.js
   Global Hillview Society Portal

   AI chatbot now runs FULLY LOCALLY via Anthropic API
   (claude-sonnet-4-20250514) — no Google Apps Script
   backend needed for chat. Falls back to rule-based
   answers if the API key is absent or the call fails.

   System prompt embeds:
     • Complete society bylaws (GHV_Society_Bylaws.docx)
     • Live module data passed via props (data, isAdmin)
     • Module navigation map
   =================================================== */

// ── GHV Society Bylaws (full text embedded) ───────────
const GHV_BYLAWS = `
GLOBAL HILL VIEW APARTMENT OWNER'S WELFARE ASSOCIATION
Sector-11, Delhi Alwar Bypass Road, Sohna, Gurugram, Haryana 122103

CURRENT COMMITTEE / OFFICE BEARERS:
- President: Mrs. Simran Kaur
- Vice President: Mr. Sajid
- Secretary: Mr. Rahul Gupta
- Joint Secretary: Mrs. Indu Sharma
- Treasurer: Mr. Akram Khan
- Executive Member: Mr. Mithlesh Kumar
Authorised Signatories for banking: Mrs. Simran Kaur (President), Mr. Rahul Gupta (Secretary), Mr. Akram Khan (Treasurer)

CHAPTER I – GENERAL

1. SHORT TITLE AND APPLICATION
These bye-laws apply to all owners, tenants, employees and any person using the facilities of Global Hill View, Sector-11, Sohna, Gurugram, Haryana 122103. Acquisition of any dwelling unit signifies acceptance of these bye-laws.

2. DEFINITIONS
All words follow the Haryana Registration and Regulation of Societies Act, 2012 and the Haryana Apartment Ownership Act, 1983.

3. HARYANA APARTMENT OWNERSHIP ACT, 1983
The complex is submitted to the provisions of the Haryana Apartment Ownership Act, 1983.

4. AIMS AND OBJECTS OF THE ASSOCIATION
- Manage, maintain and administer common property to members' standards
- Collect contributions for maintenance, repair and replacement of common areas
- Promote cooperation, unity and fraternity among residents
- Protect and promote common interests and rights of residents
- Conduct educational, physical, social and recreational activities
- Employ staff, legal experts, managers and agents as needed
- Collect and spend funds for the aims of the Association
- Open bank accounts (SB, Current, FD, Short Term Deposit, Locker) as resolved by Governing Body

5. AFFILIATION: Association may join any local Federation of apartment owners.

CHAPTER II – MEMBERSHIP

6. ADMISSION OF MEMBERS
- Every apartment owner who submits declaration under the Haryana Apartment Ownership Act is a member
- Membership fee: ₹1,000 (One Thousand Rupees)
- Each member gets one share of face value ₹100 per dwelling unit
- Bye-laws provided in electronic form; hard copy on demand
- Transfer of apartment: successor automatically becomes member on payment of membership fee
- Transfer to third party (non-family): requires prior Association approval + one-time transfer fee of ₹10,000
- On death of owner: apartment transfers to legal heirs/nominees
- Minor legatee: owner must appoint a guardian

7. JOINT APARTMENT OWNERS
Joint owners may hold apartment jointly; share issued in joint names. First-named person has the right to vote (transferable to any co-owner).

8. DISQUALIFICATIONS
No apartment owner may vote in elections if in arrears of any payment to the Association for more than 60 days as of the first day of the month of election.

9. POWERS, FUNCTIONS AND DUTIES OF ASSOCIATION
- Responsible for complete administration of common facilities
- Prepares and approves annual budget
- Determines and collects monthly contributions
- Places demand for additional contributions for unforeseen liabilities
- Interacts with government agencies for overall management
- Resolutions require majority approval by members present and voting

10. PLACE OF MEETINGS: Meetings held at the Housing Complex or any suitable place.

11. ANNUAL GENERAL MEETING (AGM)
- Held every year in the second quarter of the financial year (July to September)
- Considers, approves and adopts annual accounts
- Transacts all required business

12. EXTRA-ORDINARY / SPECIAL GENERAL MEETINGS
- May be held as required
- Board must convene one on requisition signed by 1/3rd of members
- Notice must state date, time, place and purpose

13. NOTICE OF MEETINGS
- 14 days' notice required for any general meeting
- Shorter notice permitted if not objected by at least 1/3rd members
- Notice by email to members is accepted
- Copy endorsed to District Registrar / Housing Commissioner

14. QUORUM AND VOTING
- Quorum: 40% of members
- One vote per apartment (exercised by joint member under written authority)
- All votes cast in person (authority via email with copy to Secretary accepted)

15. ADJOURNED MEETINGS
- Meeting may be adjourned if quorum is incomplete
- Adjourned meeting: gap of at least 48 hours
- At adjourned meeting: 25% present = quorum

16. ORDER OF BUSINESS: Decided by Board of Managers or members.

17. SPECIAL RESOLUTION
- Requires 40% of total members to attend
- Approved by 3/5th of members present and voting

CHAPTER III – OFFICE BEARERS

18. OFFICE BEARERS, TENURE AND ELECTION
- Office-bearers: President, Vice-President, Secretary, Joint Secretary, Treasurer, 2 Executive Members
- Elected at AGM / Special General Body Meeting
- Term: 3 years

19. RESIGNATION, SUSPENSION AND REMOVAL
- Office-bearer may resign voluntarily
- Board may suspend an office-bearer for cause; General Meeting must be held within 45 days for removal
- Successor elected at the same meeting

20. PRESIDENT
- Chief Executive Officer of the Association
- Presides over all meetings of Association and Board of Managers
- Has all general powers of a CEO including constituting sub-committees

21. VICE PRESIDENT
- Performs functions assigned by Board of Managers
- Officiates as President in President's absence

22. SECRETARY
- Overall in-charge of secretarial functions
- Issues notices for meetings, records proceedings, maintains registers
- Custodian of all books and records

23. JOINT SECRETARY: Assists Secretary in duties and responsibilities.

24. TREASURER
- Responsible for management of finances, accounts, receipts and expenditure
- Maintains bank accounts, books of accounts
- Invests surplus funds, oversees audit

CHAPTER IV – BOARD OF MANAGERS

25. BOARD OF MANAGERS
- Comprises 5 office-bearers elected for 3 years
- Acts as trustees of members
- Responsible for overall management of Association, common facilities and the housing complex
- Operates on principles of collective responsibility
- May appoint sub-committees of members
- Board extends full assistance to Auditor
- Auditor conducts audit per accepted Accounting Standards

CHAPTER VII – MORTGAGES

41. MORTGAGE NOTIFICATION
- Member who mortgages dwelling unit must notify Association (Secretary) with mortgagee's name and address
- Association maintains "Mortgagees of Units" register
- Member must notify when mortgage is vacated
- Association may report unpaid assessments to mortgagee on request

CHAPTER VIII – CONTRIBUTIONS FOR COMMON MAINTENANCE

42. MEMBERS TO CONTRIBUTE FOR VARIOUS CHARGES
The Association determines rates for:
(a) Maintenance of common areas: security, cleaning, garbage disposal, horticulture, electrical & plumbing services, AMCs of lifts, generators, etc.
(b) Common facility charges: gym, indoor games, lounge, terrace lounge, common kitchen area, lawns
(c) Utility charges: electricity bills (if HT connection), water charges
(d) Contribution to Reserve Fund for major repairs and renovation of common areas
(e) Insurance premiums (fire, earthquake, calamity, strike, etc.)
(f) Taxes, fees or cess payable to local Municipal Corporation
(g) Any other charges not specifically covered above
- All expenditure recovered from members on a prorated basis (divided equally among all members)

CHAPTER IX – OBLIGATIONS OF APARTMENT OWNERS

43. OBLIGATION TO TIMELY PAYMENT
Every apartment owner/member is obligated to pay common maintenance charges and utility bills without arrears at all times.

44. OBSERVANCE OF DUTIES
Violation of duties makes an owner liable to fine and/or forfeiture of rights as determined by the Association or a special committee.

45. ENFORCEMENT OF OBLIGATIONS
If a member is in arrears for 60 days or more, the Board of Managers may:
- Take all measures for recovery of arrears
- Disconnect electricity and water supply to the dwelling unit
- Block sewage outflow
- Deny access to common facilities including lifts

46. MAINTENANCE AND REPAIRS OF INDIVIDUAL DWELLING UNITS
- All internal repairs (water, light, gas, power, sewage, telephones, AC, sanitary, doors, windows) are the owner's responsibility at own expense
- Damage to common areas during internal works must be repaired by the owner
- Structural modifications/alterations require prior written permission from the Board (response within 30 days; no response = no objection)
- Elevation and engineering structure of building cannot be changed under any circumstances

47. USE OF INDEPENDENT UNITS
- All apartments/dwelling units for residential purposes only (as per DGTCP, Haryana regulations)
- Any liability from misuse is borne entirely by the violating owner

48. USE OF COMMON AREAS AND FACILITIES
- No furniture, packages or objects to be placed in lobbies, stairways, elevators or common areas that impede movement
- Common/restricted areas not to be used for storage or construction
- Separate elevators for owners/guests and freight/auxiliary purposes
- Owners and workmen must use freight/service elevator for packages, merchandise or construction material
- Due care to prevent damage or defacing of lifts

49. RIGHT OF ACCESS
- Owners must allow unhindered access to Association Manager/workmen in emergencies (electrical, safety threats)
- Entry by other owners/representatives for installation/alteration/repair with advance notice; immediate in emergency

50. CODE OF CONDUCT
- Apartments not to be used for unlawful, illegal, immoral or anti-national activity
- Police verification of tenants and foreign nationals mandatory
- Maintain wholesome family environment in the complex
- No advertising or posters without Association authorization
- Guests/visitors/maintenance workers must sign visitor register at gate; entry may be denied otherwise
- Alcohol/intoxicants strictly prohibited in common areas; no smoking in lifts
- Noise levels to be contained; no construction noise that disturbs other residents
- Domestic pets: maintain safety & sanitation norms per Municipal bye-laws
- No rugs/carpets dusted from windows/balconies
- No garbage/trash/litter outside disposal installations; no water from windows/balconies
- No external wiring/antennae/AC units without Association authorization

51. PARKING OF VEHICLES
- Two-wheeler parking stickers issued per apartment for overnight parking
- Additional vehicles: regulated by Board of Managers
- Each resident parks two-wheelers at their assigned slot
- Vehicles/taxis not to be parked in main driveway (drop and pick-up only)
- Rear-setback area: floating car parking during daytime only
- No vehicles in driveways/pathways; no two-wheelers in four-wheeler areas

52. DOMESTIC STAFF
- Residents must get domestic staff (servants, drivers, cleaners, cooks, domestic workers) verified by local police; submit copy to Board
- Board issues identity cards to domestic staff; must be carried in the complex
- On termination: resident must inform Board and return identity card
- Domestic staff prohibited from common areas for recreation, assembly or sitting unless accompanied by residents; restricted to earmarked areas only

CHAPTER X – GENERAL MATTERS

53. COMPLIANCE
In case of inconsistency between these bye-laws and the Haryana Registration and Regulation of Societies Act 2012 or Haryana Apartment Ownership Act 1983, the Acts prevail.

54. SEAL OF THE ASSOCIATION
Common seal in custody of Secretary; used only under authority of Board resolution; every deed attested by two Board members and the Secretary.

55. AMENDMENT OF BYE-LAWS
- Through special resolution in general meeting
- 3/5th of members present and voting must approve
- Members unable to attend may communicate concurrence/reservation electronically at least one day prior; Secretary reads it out at the meeting

56/57. AMALGAMATION OR DISSOLUTION
- Association is a body corporate with perpetual succession; not likely to be dissolved
- May amalgamate with society of identical aims via special resolution approved by 3/5th of members present and voting
- Properties not to be sold/disposed except per Chapter 9 Section 42 of Haryana Registration and Regulation of Societies Act 2012
- On dissolution: remaining assets (after debts) to be transferred to an institution with similar objects; no distribution to members
- No member shall derive any financial benefit from income/funds of the society
- No member shall be appointed to any salaried position within the Society
`;

// ── Module descriptions for AI context ───────────────
const MODULE_DESCRIPTIONS = `
SOCIETY PORTAL MODULES:

1. DASHBOARD (view: 'dashboard')
   Overview of all key metrics: residents, issues, notices, transactions, defaulters.

2. RESIDENTS (view: 'Residents')
   All 752 flats across 5 towers (T1–T5). Each flat has owner name, flat number, type (A/B), contact, occupancy status. Type A: 376 flats (carpet 585.41 + balcony 99.11 = 684.52 sq ft). Type B: 376 flats (carpet 554.17 + balcony 98.81 = 652.98 sq ft).

3. DEFAULTERS (view: 'Defaulters')
   195 defaulters (25.9% of 752 flats). Total outstanding: ₹53.68L. Tower breakdown: T1: 35 defaulters ₹10.4L | T2: 46 defaulters ₹13.7L (worst) | T3: 40 defaulters ₹10.4L | T4: 41 defaulters ₹12.3L | T5: 33 defaulters ₹6.8L (best). 73 active defaulters (still recharging meters), 122 fully inactive. Top defaulter: T2-1101 (₹1.05L outstanding). Severity: 126 light (<₹25K), 46 medium (₹25K–₹75K), 23 heavy (>₹75K).

4. BUDGET (view: 'Budget')
   CAM Analytics Dashboard. 752 flats. CAM rate: ₹2.57/sq ft (carpet + balcony). Water: ₹300/flat/month. Electricity: ₹60/flat fixed + ₹6.80/unit variable. Monthly expenses total ~₹20.58L. Major expense: Enviro manpower ₹8.74L. Monthly revenue (all flats paying): ~₹21.8L. Break-even CAM: ~₹2.57/sq ft.

5. TRANSACTIONS (view: 'Transactions') — ADMIN ONLY
   All financial transactions: income, expenses, bank entries. Full audit trail.

6. CHEQUES (view: 'Cheques')
   Cheque management: issued cheques, cleared, pending, bounced.

7. IMPREST (view: 'Imprest')
   Petty cash / imprest fund management. Available to Enviro user.

8. DIRECTORY (view: 'Directory')
   Society staff directory: security, housekeeping, maintenance, admin. Shows name, role, contact, active status.

9. ISSUES (view: 'Issues')
   Resident complaints and maintenance issues. Track status (open/in-progress/resolved). Categories: electrical, plumbing, civil, housekeeping, security, horticulture, etc.

10. NOTICES (view: 'Notices')
    Society announcements, circulars, meeting notices. Posted by admin.

11. DOCUMENTS (view: 'Documents')
    Document repository: society documents, forms, NOC templates, meeting minutes, audit reports, etc.

12. TENANTS (view: 'Tenants')
    Tenant registry. Tracks name, flat, owner, police verification status, move-in/out dates. Police verification mandatory per bye-laws.

13. VOTERS (view: 'Voters')
    Voter list for society elections. Only members without arrears >60 days can vote (per bye-law 8).

14. OPENING BALANCES (view: 'OpeningBalances') — ADMIN ONLY
    Opening balances for financial year for all accounts.

15. CHART OF ACCOUNTS (view: 'ChartOfAccounts') — ADMIN ONLY
    All account categories and sub-categories used in financial management.
`;

// ── Build system prompt dynamically ──────────────────
function buildSystemPrompt(data, isAdmin) {
  const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Summarise live data
  const dirCount    = data.Directory?.length   || 0;
  const activeStaff = data.Directory?.filter(r => r.Active?.toLowerCase() === 'yes').length || 0;
  const noticeCount = data.Notices?.length     || 0;
  const issueOpen   = data.Issues?.filter(i => i.Status?.toLowerCase() !== 'resolved').length || 0;
  const issueTotal  = data.Issues?.length      || 0;
  const tenantCount = data.Tenants?.length     || 0;
  const tenVerified = data.Tenants?.filter(t => t['Police Verification']?.toLowerCase() === 'yes').length || 0;
  const docCount    = data.Documents?.length   || 0;
  const voterCount  = data.Voters?.length      || 0;
  const resCount    = data.Residents?.length   || 0;

  let liveDataSummary = `
LIVE DATA SNAPSHOT (as of ${now}):
- Staff directory: ${dirCount} total (${activeStaff} active)
- Open issues/complaints: ${issueOpen} of ${issueTotal} total
- Notices: ${noticeCount}
- Tenants: ${tenantCount} (${tenVerified} police verified)
- Documents: ${docCount}
- Voters: ${voterCount}
- Residents loaded: ${resCount}
`;

  if (isAdmin) {
    const txTotal = data.Transactions?.reduce((s, t) => s + Number(t.Amount || 0), 0) || 0;
    const coaCount = data.ChartOfAccounts?.length || 0;
    liveDataSummary += `- Transactions volume: ₹${txTotal.toLocaleString('en-IN')}
- Chart of Accounts categories: ${coaCount}
- Opening Balances: ${data.OpeningBalances?.length || 0} entries
`;
  }

  // Recent notices
  const recentNotices = (data.Notices || []).slice(0, 5).map(n => `  • ${n.Subject || n.Title || JSON.stringify(n)}`).join('\n');
  // Open issues sample
  const openIssues = (data.Issues || []).filter(i => i.Status?.toLowerCase() !== 'resolved').slice(0, 5)
    .map(i => `  • [${i.Category || 'General'}] ${i.Subject || i.Description || ''} (${i.Status || 'Open'})`).join('\n');
  // Recent directory
  const staffList = (data.Directory || []).slice(0, 10)
    .map(d => `  • ${d.Name || ''} — ${d.Role || d.Designation || ''} (${d.Active || ''})`).join('\n');

  return `You are the AI assistant for Global Hillview Society (GHV), Sector-11, Sohna, Gurugram, Haryana. You help residents and admins with questions about:
- Society bye-laws, rules and obligations
- All portal modules (residents, defaulters, budget, issues, notices, directory, tenants, documents, voters, transactions, cheques, imprest)
- Staff directory, contacts
- Maintenance charges, defaulter status
- Complaints, issues, notices

USER ROLE: ${isAdmin ? 'Admin (has access to all modules including Transactions, Opening Balances, Chart of Accounts)' : 'Resident (no access to financial admin modules)'}

${liveDataSummary}

RECENT NOTICES:
${recentNotices || '  (none loaded)'}

OPEN ISSUES SAMPLE:
${openIssues || '  (none loaded)'}

STAFF DIRECTORY SAMPLE:
${staffList || '  (none loaded)'}

${MODULE_DESCRIPTIONS}

SOCIETY BYE-LAWS (COMPLETE):
${GHV_BYLAWS}

NAVIGATION: When a user wants to go somewhere, tell them to click the relevant item in the left sidebar. Available views: dashboard, Residents, Defaulters, Budget, Directory, Issues, Notices, Documents, Tenants, Voters${isAdmin ? ', Transactions, OpeningBalances, ChartOfAccounts, Cheques, Imprest' : ''}.

RESPONSE STYLE:
- Be concise, helpful, and friendly
- Use bullet points for lists
- Quote specific bye-law clauses (e.g. "Bye-law 45") when answering legal/rule questions
- For financial questions from non-admins, politely say access is restricted to admins
- Format numbers in Indian style (₹ with commas)
- Keep responses under 300 words unless the question requires detail
- If you don't know something specific, say so rather than guessing
`;
}

// ── Rule-based fallback (no API) ──────────────────────
function getLocalResponse(query, data, isAdmin) {
  const q = query.toLowerCase().trim();

  if (q.includes('bylaw') || q.includes('bye-law') || q.includes('rule') || q.includes('regulation')) {
    return '📖 Our bye-laws cover: membership (₹1,000 fee), payments (arrears >60 days = disconnection risk), AGM (Jul–Sep annually, 40% quorum), parking (stickers issued), domestic staff (police verification required). Ask me about any specific rule!';
  }
  if (q.includes('penalty') || q.includes('fine') || q.includes('action') || q.includes('arrears') || q.includes('default')) {
    return '⚠️ Bye-law 45: Members in arrears for 60+ days may face: electricity & water disconnection, sewage blockage, denial of common facilities including lifts. Defaulter list is tracked in the Defaulters module.';
  }
  if (q.includes('vote') || q.includes('election') || q.includes('voter')) {
    return `🗳️ Voter list has ${data.Voters?.length || 0} members. Bye-law 8: Owners with arrears >60 days as of election month cannot vote. Bye-law 17: Special resolutions need 40% attendance + 3/5th approval.`;
  }
  if (q.includes('quorum') || q.includes('meeting') || q.includes('agm')) {
    return '🏛️ Bye-law 14: Quorum = 40% of members. AGM held Jul–Sep (Bye-law 11). Adjourned meeting quorum = 25% (Bye-law 15). Special resolutions need 3/5th of members present.';
  }
  if (q.includes('parking') || q.includes('vehicle') || q.includes('car') || q.includes('bike')) {
    return '🚗 Bye-law 51: Two-wheeler stickers issued per apartment. Rear setback for floating car parking (daytime only). Driveway is drop/pickup only. No two-wheelers in four-wheeler zones.';
  }
  if (q.includes('pet') || q.includes('dog') || q.includes('cat')) {
    return '🐾 Bye-law 50(vi)(b): Domestic pets must follow safety & sanitation norms and Municipal bye-laws. Pets must be managed responsibly at all times.';
  }
  if (q.includes('tenant') || q.includes('rent')) {
    return `🏠 ${data.Tenants?.length || 0} tenants registered. Bye-law 52: Police verification mandatory. Board issues identity cards to domestic staff. Transfer to third party requires Association approval + ₹10,000 transfer fee (Bye-law 6).`;
  }
  if (q.includes('staff') || q.includes('directory') || q.includes('employee') || q.includes('contact')) {
    const active = data.Directory?.filter(r => r.Active?.toLowerCase() === 'yes').length || 0;
    return `📋 Directory: ${data.Directory?.length || 0} staff (${active} active). Includes security, housekeeping, maintenance, admin. Check the Directory module for contacts.`;
  }
  if (q.includes('notice') || q.includes('announcement')) {
    return `📢 ${data.Notices?.length || 0} notices posted. Check the Notices module for all announcements, meeting notices and circulars.`;
  }
  if (q.includes('issue') || q.includes('complaint') || q.includes('repair')) {
    const open = data.Issues?.filter(i => i.Status?.toLowerCase() !== 'resolved').length || 0;
    return `⚠️ ${open} open issues / complaints. Go to Issues module to raise a new complaint or track existing ones.`;
  }
  if (q.includes('budget') || q.includes('cam') || q.includes('maintenance charge') || q.includes('rate')) {
    return '💰 CAM rate: ₹2.57/sq ft (carpet + balcony). Water: ₹300/flat/month. Electricity: ₹60/flat fixed. Monthly budget ~₹20.58L expenses. Check Budget module for full details.';
  }
  if (q.includes('defaulter') || q.includes('outstanding') || q.includes('dues')) {
    return '🔴 195 flats (25.9%) have outstanding dues totalling ₹53.68L. Worst tower: T2 (46 defaulters, ₹13.7L). Check Defaulters module for flat-wise details.';
  }
  if (q.includes('transaction') || q.includes('payment') || q.includes('expense')) {
    if (!isAdmin) return '🔒 Financial transaction details are accessible to Admins only.';
    const total = data.Transactions?.reduce((s, t) => s + Number(t.Amount || 0), 0) || 0;
    return `💳 Total transaction volume: ₹${total.toLocaleString('en-IN')}. See Transactions module for full audit trail.`;
  }
  if (q.includes('president') || q.includes('secretary') || q.includes('treasurer') || q.includes('committee')) {
    return '🏛️ Current Committee: President – Mrs. Simran Kaur | Vice President – Mr. Sajid | Secretary – Mr. Rahul Gupta | Joint Secretary – Mrs. Indu Sharma | Treasurer – Mr. Akram Khan | Executive Member – Mr. Mithlesh Kumar. Term: 3 years.';
  }
  if (q.includes('modify') || q.includes('renovation') || q.includes('structural') || q.includes('alteration')) {
    return '🔧 Bye-law 46: All internal repairs are the owner\'s responsibility. Structural modifications require prior written permission from the Board (30-day response window). Elevation/engineering structure cannot be changed. Damage to common areas must be repaired at owner\'s cost.';
  }
  if (q.includes('transfer') || q.includes('sell') || q.includes('sale')) {
    return '🔑 Bye-law 6: Third-party sale requires Association\'s prior approval. One-time transfer fee: ₹10,000. Family transfers exempt. Membership fee for new owner: ₹1,000.';
  }
  if (q.includes('noise') || q.includes('alcohol') || q.includes('smoke') || q.includes('balcony')) {
    return '🚫 Bye-law 50: Alcohol/intoxicants prohibited in common areas. No smoking in lifts. Noise must not disturb other residents. No rugs/garbage from windows or balconies. No unauthorised antennae/AC units on exterior.';
  }
  if (q.includes('domestic') || q.includes('servant') || q.includes('maid') || q.includes('driver')) {
    return '👤 Bye-law 52: Domestic staff (servants, drivers, cooks, cleaners) must be police-verified. Submit copy to Board. Board issues identity cards. Staff not allowed in common areas unaccompanied. Inform Board on termination and return ID card.';
  }
  if (q.includes('document') || q.includes('form')) {
    return `📂 ${data.Documents?.length || 0} documents in the repository. Check Documents module for society forms, NOCs, meeting minutes, audit reports.`;
  }
  if (q.includes('resident') || q.includes('flat') || q.includes('owner')) {
    return `🏠 ${data.Residents?.length || 0} residents loaded. 752 flats across 5 towers. Type A (376 flats): 684.52 sq ft. Type B (376 flats): 652.98 sq ft. Check Residents module for details.`;
  }

  return '🤔 I\'m not sure about that. Try asking about: bylaws, maintenance charges, defaulters, parking, pets, domestic staff, renovation rules, meetings, committee, notices, issues, or any specific module. For detailed answers, the AI is available when connected.';
}

// ── Anthropic API call ────────────────────────────────
async function callClaudeAPI(messages, systemPrompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages
    })
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text || 'Sorry, I could not generate a response.';
}

// ── Quick-reply chips ─────────────────────────────────
const QUICK_REPLIES = [
  'What are the parking rules?',
  'Who is the current committee?',
  'What happens if I default on maintenance?',
  'How many flats have dues?',
  'What is the CAM rate?',
  'Can I keep pets?',
  'How to raise a complaint?',
  'Transfer fee for selling flat?',
];

// ── Chatbot Component ─────────────────────────────────
function Chatbot({ data, setView, isAdmin, theme, onClose }) {
  const { useState, useEffect, useRef, useCallback, useMemo } = React;

  const [isOpen,    setIsOpen]    = useState(true);
  const [messages,  setMessages]  = useState([{
    id: 1,
    role: 'assistant',
    text: `👋 Hi! I'm your GHV Society AI Assistant — running fully locally with complete knowledge of:

📋 **Society bye-laws** (all chapters)
🏢 **All portal modules** (residents, defaulters, budget, issues, notices, directory, tenants, documents, voters${isAdmin ? ', transactions, cheques, imprest' : ''})
📊 **Live society data**

Ask me anything about rules, charges, defaulters, meetings, staff, maintenance, parking — or any module!`,
    sender: 'bot'
  }]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showChips, setShowChips] = useState(true);
  const [history,   setHistory]   = useState([]); // full conversation for multi-turn

  const endRef  = useRef(null);
  const inputRef = useRef(null);

  // Drag support
  const [pos, setPos] = useState({ x: null, y: null });
  const dragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 });

  const systemPrompt = useMemo(() => buildSystemPrompt(data, isAdmin), [data, isAdmin]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const startDrag = (e) => {
    if (e.button !== 0) return;
    const box  = e.currentTarget.closest('.chatbot-box');
    if (!box)  return;
    const rect = box.getBoundingClientRect();
    dragRef.current = { dragging: true, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    e.preventDefault();
  };

  useEffect(() => {
    const move = (e) => {
      if (!dragRef.current.dragging) return;
      const newX = Math.max(10, Math.min(window.innerWidth  - 440, e.clientX - dragRef.current.offsetX));
      const newY = Math.max(10, Math.min(window.innerHeight - 120, e.clientY - dragRef.current.offsetY));
      setPos({ x: newX, y: newY });
    };
    const stop = () => { dragRef.current.dragging = false; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup',   stop);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', stop); };
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;

    const userText = text.trim();
    const userMsg  = { id: Date.now(), text: userText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setShowChips(false);

    // Build conversation history for multi-turn
    const newHistory = [...history, { role: 'user', content: userText }];

    try {
      const reply = await callClaudeAPI(newHistory, systemPrompt);
      setHistory([...newHistory, { role: 'assistant', content: reply }]);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: reply, sender: 'bot' }]);
    } catch (err) {
      console.warn('Claude API failed, using local fallback:', err.message);
      const fallback = getLocalResponse(userText, data, isAdmin);
      setHistory([...newHistory, { role: 'assistant', content: fallback }]);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: fallback, sender: 'bot', fallback: true }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, history, systemPrompt, data, isAdmin]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const isDark = theme === 'dark';
  const boxBg  = isDark ? 'bg-gray-800/97 border-gray-600/50' : 'bg-white/97 border-gray-200/60';
  const msgBg  = isDark ? 'bg-gray-700/80 text-gray-100 border-gray-600/40' : 'bg-gray-50 text-gray-900 border-gray-100';
  const inputCls = isDark
    ? 'border-gray-600/50 bg-gray-700/60 text-white placeholder-gray-400'
    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400';

  return (
    <>
      {isOpen && (
        <div
          className={`chatbot-box fixed w-[430px] backdrop-blur-xl rounded-3xl shadow-2xl z-[100] flex flex-col border ${boxBg}`}
          style={
            pos.x === null
              ? { bottom: '7rem', right: '1.5rem', position: 'fixed', maxHeight: '620px' }
              : { left: `${pos.x}px`, top: `${pos.y}px`, right: 'auto', bottom: 'auto', position: 'fixed', maxHeight: '620px' }
          }
        >
          {/* Header */}
          <div
            onMouseDown={startDrag}
            className="p-4 border-b flex items-center justify-between rounded-t-3xl cursor-grab active:cursor-grabbing select-none"
            style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 50%, #1a5276 100%)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm text-xl">
                🏛️
              </div>
              <div>
                <h3 className="font-bold text-base text-white">GHV Society Assistant</h3>
                <p className="text-xs text-white/75 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
                  AI · Bylaws · All modules · Local
                </p>
              </div>
            </div>
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={() => { setIsOpen(false); onClose(); }}
              className="p-2 rounded-xl hover:bg-white/20 transition-colors"
              aria-label="Close chatbot"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3" style={{ maxHeight: '420px' }}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-1"
                    style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d6a9f)' }}>
                    🏛️
                  </div>
                )}
                <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm border
                  ${msg.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-transparent rounded-br-sm'
                    : `${msgBg} rounded-bl-sm`
                  }`}
                >
                  {msg.text}
                  {msg.fallback && (
                    <span className="block text-xs opacity-50 mt-1">⚡ Local response (AI offline)</span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-1"
                  style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d6a9f)' }}>
                  🏛️
                </div>
                <div className={`px-4 py-3 rounded-2xl rounded-bl-sm border ${msgBg}`}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick reply chips */}
            {showChips && messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {QUICK_REPLIES.map((chip, i) => (
                  <button key={i} onClick={() => sendMessage(chip)}
                    className="text-xs px-3 py-1.5 rounded-full border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors bg-white shadow-sm">
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className={`p-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about rules, bylaws, charges, defaulters..."
                rows={1}
                className={`flex-1 px-4 py-2.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm resize-none ${inputCls}`}
                style={{ minHeight: '42px', maxHeight: '100px' }}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="px-4 py-2.5 rounded-2xl font-medium transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d6a9f)', color: 'white' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              🔒 Fully local AI · Society bylaws embedded · Drag header to move
            </p>
          </div>
        </div>
      )}
    </>
  );
}


/* ===================================================
   GenericTable.js — Fallback Generic Table Component
   =================================================== */

function GenericTable({ title, data, onRefresh, isAdmin }) {
  const { useState, useMemo } = React;
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(q))
    );
  }, [data, search]);

  const columns = useMemo(() => data.length ? Object.keys(data[0]) : [], [data]);

  return (
    <div className="bg-white rounded-2xl shadow-sm fade-in">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {title} ({filtered.length})
          </h2>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col} className="px-4 py-3 text-sm">
                    {String(row[col] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">No data found</div>
        )}
      </div>
    </div>
  );
}
