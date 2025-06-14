import { Search, Star, Github } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Header({ searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Github className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-semibold">MCP Security Servers</h1>
              <p className="text-sm text-primary-foreground/80">
                Splunk SIEM • CrowdStrike EDR • Microsoft MISP
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-64 bg-background text-foreground"
              />
            </div>
            <Button variant="secondary" size="sm">
              <Star className="mr-2 h-4 w-4" />
              Star
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
