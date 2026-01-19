export const FONT_OPTIONS = {
    // English Fonts
    'Modern': {
        label: 'Modern (Inter)',
        family: "'Inter', sans-serif",
        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap'
    },
    'Slab': {
        label: 'Journal (Roboto Slab)',
        family: "'Roboto Slab', serif",
        url: 'https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;800&display=swap'
    },
    'Lato': {
        label: 'Elegant (Lato)',
        family: "'Lato', sans-serif",
        url: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap'
    },
    'Montserrat': {
        label: 'Geometric (Montserrat)',
        family: "'Montserrat', sans-serif",
        url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap'
    },
    'Poppins': {
        label: 'Friendly (Poppins)',
        family: "'Poppins', sans-serif",
        url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap'
    },
    'Playfair': {
        label: 'Classic (Playfair)',
        family: "'Playfair Display', serif",
        url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap'
    },

    // Telugu Fonts
    'Ramabhadra': {
        label: 'Ramabhadra',
        family: "'Ramabhadra', sans-serif",
        url: 'https://fonts.googleapis.com/css2?family=Ramabhadra&display=swap'
    },
    'TenaliRamakrishna': {
        label: 'Tenali Ramakrishna',
        family: "'Tenali Ramakrishna', sans-serif",
        url: 'https://fonts.googleapis.com/css2?family=Tenali+Ramakrishna&display=swap'
    },
    'Dhurjati': {
        label: 'Dhurjati',
        family: "'Dhurjati', sans-serif",
        url: 'https://fonts.googleapis.com/css2?family=Dhurjati&display=swap'
    },
    'Suranna': {
        label: 'Suranna',
        family: "'Suranna', serif",
        url: 'https://fonts.googleapis.com/css2?family=Suranna&display=swap'
    },
    'NotoSansTelugu': {
        label: 'Noto Sans Telugu',
        family: "'Noto Sans Telugu', sans-serif",
        url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;700&display=swap'
    },
    'Peddana': {
        label: 'Peddana',
        family: "'Peddana', serif",
        url: 'https://fonts.googleapis.com/css2?family=Peddana&display=swap'
    },
    'Ponnur': {
        label: 'Ponnur',
        family: "'Ponnur', system-ui",
        url: 'https://fonts.googleapis.com/css2?family=Ponnur&display=swap'
    },
    'RaviPrakash': {
        label: 'Ravi Prakash',
        family: "'Ravi Prakash', system-ui",
        url: 'https://fonts.googleapis.com/css2?family=Ravi+Prakash&display=swap'
    },
    'SreeKrushnadevaraya': {
        label: 'Sree Krushnadevaraya',
        family: "'Sree Krushnadevaraya', serif",
        url: 'https://fonts.googleapis.com/css2?family=Sree+Krushnadevaraya&display=swap'
    },
    'Suravaram': {
        label: 'Suravaram',
        family: "'Suravaram', serif",
        url: 'https://fonts.googleapis.com/css2?family=Suravaram&display=swap'
    },
    'Timmana': {
        label: 'Timmana',
        family: "'Timmana', system-ui",
        url: 'https://fonts.googleapis.com/css2?family=Timmana&display=swap'
    },
    'Mallanna': {
        label: 'Mallanna',
        family: "'Mallanna', system-ui",
        url: 'https://fonts.googleapis.com/css2?family=Mallanna&display=swap'
    },
    'Mandali': {
        label: 'Mandali',
        family: "'Mandali', sans-serif",
        url: 'https://fonts.googleapis.com/css2?family=Mandali&display=swap'
    },
    'LakkiReddy': {
        label: 'Lakki Reddy',
        family: "'Lakki Reddy', handwriting",
        url: 'https://fonts.googleapis.com/css2?family=Lakki+Reddy&display=swap'
    },
    'Gurajada': {
        label: 'Gurajada',
        family: "'Gurajada', serif",
        url: 'https://fonts.googleapis.com/css2?family=Gurajada&display=swap'
    },
    'Gidugu': {
        label: 'Gidugu',
        family: "'Gidugu', sans-serif",
        url: 'https://fonts.googleapis.com/css2?family=Gidugu&display=swap'
    },
    'NTR': {
        label: 'NTR',
        family: "'NTR', sans-serif",
        url: 'https://fonts.googleapis.com/css2?family=NTR&display=swap'
    },
    'Ramaraja': {
        label: 'Ramaraja',
        family: "'Ramaraja', serif",
        url: 'https://fonts.googleapis.com/css2?family=Ramaraja&display=swap'
    }
} as const;

export type FontKey = keyof typeof FONT_OPTIONS;
