import React from 'react';
import { createRoot } from 'react-dom/client';
import HRM from '../src/components/HRM';

const mockUser = {
  id: 'owner',
  name: 'Owner User',
  role: 'owner',
  permissions: { admin: true }
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<HRM activeUser={mockUser} onUpdate={() => {}} isMobile={true} />);
console.log('React finished registering render task.');
