import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="text-sm text-muted-foreground italic">
            <span>This project is a learning demonstration</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
            <span>Built with</span>
            <Heart className="w-3 h-3 fill-red-500 text-red-500" />
            <span>using React + OpenAI</span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            © {new Date().getFullYear()} Internal Developer Platform. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
