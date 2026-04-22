/**
 * Location search utilities — city list per state + map search via Nominatim
 */

/**
 * Major cities by state/region — keyed by state name. Covers India (all
 * states), United States (50 states + DC), United Kingdom (England / Scotland
 * / Wales / Northern Ireland), Singapore (5 regions), and UAE (7 emirates).
 * State names are globally unique across these countries so a flat map works.
 */
export const STATE_CITIES: Record<string, string[]> = {
  // ─── India ──────────────────────────────────────────────────────────
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Kakinada', 'Tirupati', 'Rajahmundry', 'Anantapur', 'Eluru'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Tawang', 'Ziro', 'Pasighat', 'Bomdila'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Arrah', 'Begusarai'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Morbi'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak', 'Sonipat'],
  'Himachal Pradesh': ['Shimla', 'Manali', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Baddi'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Giridih'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Davangere', 'Shivamogga', 'Tumakuru', 'Udupi'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha', 'Palakkad', 'Malappuram'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Rewa'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Thane', 'Kolhapur', 'Navi Mumbai', 'Amravati'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongpoh'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur', 'Pathankot'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Alwar', 'Bhilwara', 'Sikar'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thanjavur', 'Dindigul', 'Hosur'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Mahbubnagar', 'Secunderabad'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar'],
  'Uttar Pradesh': ['Lucknow', 'Noida', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Bareilly', 'Aligarh', 'Greater Noida'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh', 'Haldwani', 'Roorkee', 'Kashipur', 'Rudrapur'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Kharagpur'],
  'Delhi': ['New Delhi', 'Delhi'],
  'Chandigarh': ['Chandigarh'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore'],
  'Ladakh': ['Leh', 'Kargil'],
  'Andaman and Nicobar Islands': ['Port Blair', 'Car Nicobar', 'Diglipur'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Silvassa', 'Daman', 'Diu'],
  'Lakshadweep': ['Kavaratti', 'Agatti', 'Minicoy'],

  // ─── United States ──────────────────────────────────────────────────
  Alabama: ['Birmingham', 'Montgomery', 'Huntsville', 'Mobile', 'Tuscaloosa'],
  Alaska: ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka'],
  Arizona: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Tempe'],
  Arkansas: ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale'],
  California: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento', 'Fresno', 'Oakland', 'Long Beach', 'Anaheim', 'Santa Clara', 'Irvine', 'Santa Monica', 'Berkeley'],
  Colorado: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Boulder', 'Lakewood'],
  Connecticut: ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury'],
  Delaware: ['Wilmington', 'Dover', 'Newark', 'Middletown'],
  Florida: ['Miami', 'Jacksonville', 'Tampa', 'Orlando', 'St. Petersburg', 'Fort Lauderdale', 'Tallahassee'],
  Georgia: ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens', 'Macon'],
  Hawaii: ['Honolulu', 'Hilo', 'Kailua', 'Kaneohe'],
  Idaho: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls'],
  Illinois: ['Chicago', 'Aurora', 'Rockford', 'Naperville', 'Springfield', 'Peoria'],
  Indiana: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Bloomington'],
  Iowa: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City'],
  Kansas: ['Wichita', 'Overland Park', 'Kansas City', 'Topeka', 'Olathe'],
  Kentucky: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro'],
  Louisiana: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'],
  Maine: ['Portland', 'Lewiston', 'Bangor', 'Augusta'],
  Maryland: ['Baltimore', 'Annapolis', 'Rockville', 'Frederick', 'Gaithersburg'],
  Massachusetts: ['Boston', 'Cambridge', 'Worcester', 'Springfield', 'Lowell', 'Quincy'],
  Michigan: ['Detroit', 'Grand Rapids', 'Ann Arbor', 'Lansing', 'Flint', 'Warren'],
  Minnesota: ['Minneapolis', 'Saint Paul', 'Rochester', 'Duluth', 'Bloomington'],
  Mississippi: ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg'],
  Missouri: ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence'],
  Montana: ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Helena'],
  Nebraska: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island'],
  Nevada: ['Las Vegas', 'Reno', 'Henderson', 'Carson City', 'Sparks'],
  'New Hampshire': ['Manchester', 'Nashua', 'Concord', 'Portsmouth'],
  'New Jersey': ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Trenton', 'Edison'],
  'New Mexico': ['Albuquerque', 'Santa Fe', 'Las Cruces', 'Rio Rancho'],
  'New York': ['New York City', 'Buffalo', 'Rochester', 'Syracuse', 'Albany', 'Yonkers'],
  'North Carolina': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Cary'],
  'North Dakota': ['Fargo', 'Bismarck', 'Grand Forks', 'Minot'],
  Ohio: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton'],
  Oklahoma: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow'],
  Oregon: ['Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro', 'Beaverton'],
  Pennsylvania: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Harrisburg'],
  'Rhode Island': ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'Newport'],
  'South Carolina': ['Charleston', 'Columbia', 'North Charleston', 'Greenville'],
  'South Dakota': ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Pierre'],
  Tennessee: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville'],
  Texas: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Plano'],
  Utah: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem', 'Sandy'],
  Vermont: ['Burlington', 'South Burlington', 'Rutland', 'Montpelier'],
  Virginia: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Arlington', 'Alexandria'],
  Washington: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent', 'Everett', 'Olympia'],
  'West Virginia': ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg'],
  Wisconsin: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine'],
  Wyoming: ['Cheyenne', 'Casper', 'Laramie', 'Gillette'],
  'District of Columbia': ['Washington'],

  // ─── United Kingdom ────────────────────────────────────────────────
  England: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Newcastle upon Tyne', 'Nottingham', 'Leicester', 'Coventry', 'Bradford', 'Southampton', 'Portsmouth', 'Oxford', 'Cambridge'],
  Scotland: ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Stirling', 'Inverness', 'Perth'],
  Wales: ['Cardiff', 'Swansea', 'Newport', 'Bangor', 'St Davids', 'Wrexham'],
  'Northern Ireland': ['Belfast', 'Derry', 'Lisburn', 'Newry', 'Armagh'],

  // ─── Singapore ─────────────────────────────────────────────────────
  Central: ['Downtown Core', 'Marina Bay', 'Orchard', 'Outram', 'Bukit Merah', 'Queenstown', 'Newton', 'Novena', 'Tanglin', 'Toa Payoh'],
  East: ['Bedok', 'Changi', 'Pasir Ris', 'Tampines', 'Paya Lebar'],
  North: ['Woodlands', 'Yishun', 'Sembawang', 'Mandai'],
  'North-East': ['Hougang', 'Punggol', 'Sengkang', 'Serangoon', 'Ang Mo Kio'],
  West: ['Jurong East', 'Jurong West', 'Bukit Batok', 'Clementi', 'Choa Chu Kang', 'Bukit Panjang', 'Tuas'],

  // ─── United Arab Emirates ──────────────────────────────────────────
  'Abu Dhabi': ['Abu Dhabi', 'Al Ain', 'Madinat Zayed', 'Ruwais', 'Liwa Oasis'],
  Ajman: ['Ajman', 'Masfout', 'Manama'],
  Dubai: ['Dubai', 'Hatta', 'Jebel Ali', 'Nad Al Sheba'],
  Fujairah: ['Fujairah', 'Dibba Al-Fujairah', 'Al Bidiyah', 'Masafi'],
  'Ras Al Khaimah': ['Ras Al Khaimah', 'Al Jazirah Al Hamra', 'Khor Khwair'],
  Sharjah: ['Sharjah', 'Khor Fakkan', 'Kalba', 'Dibba Al-Hisn'],
  'Umm Al Quwain': ['Umm Al Quwain', 'Falaj Al Mualla'],
};

/**
 * Search places using OpenStreetMap Nominatim API (free, no key required).
 * Returns array of place results with name, state, lat, lon.
 */
export async function searchPlaceOnMap(query: string): Promise<{
  displayName: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  lat: string;
  lon: string;
  addressLine1: string;
}[]> {
  if (!query || query.length < 3) return [];

  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=6&countrycodes=in`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return [];

    const data = await res.json();
    return data.map((item: Record<string, unknown>) => {
      const addr = item.address as Record<string, string> | undefined;
      return {
        displayName: item.display_name as string,
        city: addr?.city || addr?.town || addr?.village || addr?.county || '',
        state: addr?.state || '',
        country: addr?.country || '',
        pincode: addr?.postcode || '',
        lat: item.lat as string,
        lon: item.lon as string,
        addressLine1: [addr?.road, addr?.neighbourhood, addr?.suburb].filter(Boolean).join(', '),
      };
    });
  } catch {
    return [];
  }
}
