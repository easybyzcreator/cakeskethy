import { motion } from 'motion/react';

export function Footer() {
  return (
    <footer className="relative py-12 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <span className="text-[10px] uppercase tracking-[0.4em] text-secondary font-medium">
            Desenvolvido por
          </span>
          <a 
            href="https://www.easybyzcreator.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group block"
          >
            <motion.img 
              src="https://i.ibb.co/Xf0T4snH/patitour-2026-01-27-T112542-860.png" 
              alt="EasyByz Creator" 
              className="w-28 h-auto grayscale opacity-40 transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-100 active:scale-95"
              referrerPolicy="no-referrer"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
