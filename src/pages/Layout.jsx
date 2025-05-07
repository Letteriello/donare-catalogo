
import React from "react";

export default function Layout({ children, currentPageName }) {
  return (
    <div className="relative min-h-screen bg-[#F4F1EC] text-[#0B1F3A]">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap');
          
          :root {
            --color-navy: #0B1F3A;
            --color-beige: #F4F1EC;
            --color-white: #FFFFFF;
            --font-montserrat: 'Montserrat', sans-serif;
          }
          
          body, html {
            font-family: var(--font-montserrat);
            background-color: var(--color-beige);
            color: var(--color-navy);
          }
          
          .font-belleza {
            font-family: 'Belleza', 'Cinzel', 'Times New Roman', serif;
          }
          
          .transition-all {
            transition: all 0.3s ease;
          }
          
          .card-shadow {
            box-shadow: 0 4px 20px rgba(11, 31, 58, 0.08);
          }
          
          .card-hover:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(11, 31, 58, 0.12);
          }
          
          .btn-primary {
            background-color: var(--color-navy);
            color: white;
            border-radius: 12px;
            padding: 0.5rem 1.25rem;
            font-weight: 500;
            transition: all 0.3s ease;
          }
          
          .btn-primary:hover {
            background-color: #152D4A;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(11, 31, 58, 0.15);
          }
          
          .social-icon {
            transition: all 0.3s ease;
          }
          
          .social-icon:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(11, 31, 58, 0.1);
          }
        `}
      </style>

      <main className="min-h-screen">
        {children}
      </main>
    </div>
  );
}
