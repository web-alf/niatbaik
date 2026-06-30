import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import './styles/input.css';

const el = document.getElementById('root');
// Clear the static preloader skeleton before mounting.
if (el) el.replaceChildren();
createRoot(el!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
