export interface LiveWithdrawalItem {
  name: string;
  phone: string;
  amount: string;
  method: 'UPI' | 'PhonePe' | 'GPay' | 'Paytm';
}

const FIRST_NAMES = [
  'Rahul', 'Amit', 'Vikram', 'Pooja', 'Deepak', 'Sanjay', 'Rohit', 'Neha', 'Manoj', 'Priya',
  'Rakesh', 'Anjali', 'Suresh', 'Kavita', 'Vikas', 'Sunita', 'Rajesh', 'Divya', 'Manish', 'Rekha',
  'Anil', 'Meena', 'Pankaj', 'Jyoti', 'Alok', 'Sangeeta', 'Gaurav', 'Swati', 'Ajay', 'Preeti',
  'Abhishek', 'Rashmi', 'Sachin', 'Ananya', 'Mohit', 'Ritu', 'Sonu', 'Sneha', 'Jitendra', 'Shilpa',
  'Mukesh', 'Aarti', 'Sandeep', 'Komal', 'Dinesh', 'Seema', 'Arvind', 'Pallavi', 'Ashish', 'Neelam',
  'Pawan', 'Shweta', 'Dharmendra', 'Babita', 'Hemant', 'Nisha', 'Sunil', 'Vandana', 'Harish', 'Pinky',
  'Praveen', 'Poonam', 'Ashok', 'Suman', 'Bhupendra', 'Mamta', 'Kamal', 'Geeta', 'Jagdish', 'Radha',
  'Rajendra', 'Kiran', 'Mahendra', 'Saroj', 'Narendra', 'Asha', 'Surendra', 'Maya', 'Devendra', 'Pushpa',
  'Ravindra', 'Shanti', 'Kuldeep', 'Manju', 'Virendra', 'Sudha', 'Satish', 'Nirmala', 'Santosh', 'Anita',
  'Jagmohan', 'Lalita', 'Naresh', 'Madhu', 'Ramesh', 'Kamlesh', 'Brijesh', 'Monika', 'Devraj', 'Kusum',
  'Chetan', 'Usha', 'Girish', 'Bhawna', 'Yogesh', 'Sapna', 'Gopal', 'Shalini', 'Navin', 'Priyanka',
  'Lalit', 'Varsha', 'Anurag', 'Deepika', 'Kunal', 'Tanvi', 'Tarun', 'Simran', 'Naveen', 'Roshni',
  'Mayank', 'Kajal', 'Pradeep', 'Isha', 'Hitesh', 'Payal', 'Bhavesh', 'Chhaya', 'Sumit', 'Sakshi',
  'Lokesh', 'Sheetal', 'Bhagwan', 'Reena', 'Dhananjay', 'Meenakshi', 'Chandan', 'Shubhangi', 'Vijay', 'Archana'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Kumar', 'Patel', 'Singh', 'Yadav', 'Gupta', 'Mishra', 'Joshi', 'Tiwari',
  'Dubey', 'Chauhan', 'Soni', 'Meena', 'Rawat', 'Nayak', 'Pandey', 'Bhatt', 'Jain', 'Kumari',
  'Saini', 'Rathore', 'Maurya', 'Das', 'Negi', 'Prajapati', 'Thakur', 'Bansal', 'Kashyap', 'Agrawal',
  'Saxena', 'Pal', 'Lodhi', 'Sahu', 'Sen', 'Goswami', 'Malviya', 'Solanki', 'Tomar', 'Rajput',
  'Jha', 'Tripathi', 'Shukla', 'Dwivedi', 'Ghosh', 'Roy', 'Dutta', 'Banerjee', 'Mondal', 'Mandal',
  'Mahato', 'Biswas', 'Chatterjee', 'Mukherjee', 'Deshmukh', 'Kulkarni', 'Shinde', 'Patil', 'Pawar', 'Gaikwad',
  'More', 'Kadam', 'Bhosale', 'Sawant', 'Jadhav', 'Chavan', 'Wagh', 'Suryavanshi', 'Naidu', 'Reddy',
  'Rao', 'Chowdary', 'Shetty', 'Pillai', 'Menon', 'Nair', 'Hegde', 'Gowda', 'Bora', 'Barman'
];

const PHONE_PREFIXES = [
  '98', '97', '96', '95', '94', '93', '92', '91', '90',
  '89', '88', '87', '86', '85', '84', '83', '82', '81', '80',
  '79', '78', '77', '76', '75', '74', '73', '72', '70'
];

const METHODS: Array<'UPI' | 'PhonePe' | 'GPay' | 'Paytm'> = ['UPI', 'PhonePe', 'GPay', 'Paytm'];
const AMOUNTS = ['₹1,000', '₹2,000', '₹3,000', '₹1,000', '₹2,000', '₹3,000', '₹5,000', '₹2,000'];

// Deterministically generate 850 diverse and realistic withdrawal entries (within 700 - 1000 requested range)
function generateWithdrawalsList(count = 850): LiveWithdrawalItem[] {
  const list: LiveWithdrawalItem[] = [];
  const usedNames = new Set<string>();

  let fIdx = 0;
  let lIdx = 0;

  for (let i = 0; i < count; i++) {
    // Generate unique First + Last Name
    let fullName = `${FIRST_NAMES[fIdx % FIRST_NAMES.length]} ${LAST_NAMES[lIdx % LAST_NAMES.length]}`;
    let attempts = 0;
    while (usedNames.has(fullName) && attempts < 10) {
      lIdx++;
      fullName = `${FIRST_NAMES[fIdx % FIRST_NAMES.length]} ${LAST_NAMES[lIdx % LAST_NAMES.length]}`;
      attempts++;
    }
    usedNames.add(fullName);

    // Realistic masked phone e.g. 98***412
    const prefix = PHONE_PREFIXES[(i * 3 + fIdx) % PHONE_PREFIXES.length];
    const last3Digits = String(100 + ((i * 73 + lIdx * 19 + 42) % 900));
    const phone = `${prefix}***${last3Digits}`;

    const method = METHODS[(i + fIdx + 1) % METHODS.length];
    const amount = AMOUNTS[(i * 2 + lIdx) % AMOUNTS.length];

    list.push({
      name: fullName,
      phone,
      method,
      amount,
    });

    fIdx++;
    if (fIdx % 3 === 0) {
      lIdx++;
    }
  }

  return list;
}

export const liveWithdrawalsList: LiveWithdrawalItem[] = generateWithdrawalsList(850);
