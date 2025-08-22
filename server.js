const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Ensure contacts directory exists
async function ensureContactsDir() {
    try {
        await fs.access('contacts');
    } catch {
        await fs.mkdir('contacts', { recursive: true });
    }
}

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    try {
        await ensureContactsDir();
        
        const { name, email, subject, message, timestamp } = req.body;
        
        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }
        
        // Create contact entry
        const contactEntry = {
            id: Date.now().toString(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            message: message.trim(),
            timestamp: timestamp || new Date().toISOString(),
            status: 'new'
        };
        
        // Save to JSON file (in production, use a proper database)
        const filename = `contact_${contactEntry.id}.json`;
        const filepath = path.join('contacts', filename);
        
        await fs.writeFile(filepath, JSON.stringify(contactEntry, null, 2));
        
        // Also maintain a contacts list
        let contactsList = [];
        try {
            const existingData = await fs.readFile('contacts/contacts_list.json', 'utf8');
            contactsList = JSON.parse(existingData);
        } catch (error) {
            // File doesn't exist yet, start with empty array
        }
        
        contactsList.push(contactEntry);
        await fs.writeFile('contacts/contacts_list.json', JSON.stringify(contactsList, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Message sent successfully!',
            id: contactEntry.id
        });
        
    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get all contacts (for admin purposes)
app.get('/api/contacts', async (req, res) => {
    try {
        const data = await fs.readFile('contacts/contacts_list.json', 'utf8');
        const contacts = JSON.parse(data);
        res.json({ success: true, contacts });
    } catch (error) {
        res.json({ success: true, contacts: [] });
    }
});

// Delete contact
app.delete('/api/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Remove from individual file
        const filepath = path.join('contacts', `contact_${id}.json`);
        await fs.unlink(filepath);
        
        // Remove from contacts list
        let contactsList = [];
        try {
            const data = await fs.readFile('contacts/contacts_list.json', 'utf8');
            contactsList = JSON.parse(data);
        } catch (error) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }
        
        contactsList = contactsList.filter(contact => contact.id !== id);
        await fs.writeFile('contacts/contacts_list.json', JSON.stringify(contactsList, null, 2));
        
        res.json({ success: true, message: 'Contact deleted successfully' });
        
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Portfolio server running on http://localhost:${PORT}`);
    console.log(`📧 Contact API available at http://localhost:${PORT}/api/contact`);
});

module.exports = app;