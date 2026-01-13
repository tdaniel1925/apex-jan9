'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Search,
  FileText,
  Video,
  FileSpreadsheet,
  Image,
  Link as LinkIcon,
  Music,
  Download,
  ExternalLink,
  FolderOpen,
  Eye
} from 'lucide-react';
import type { Resource } from '@/lib/types/training';

const resourceTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5" />,
  document: <FileText className="h-5 w-5" />,
  spreadsheet: <FileSpreadsheet className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  audio: <Music className="h-5 w-5" />,
  link: <LinkIcon className="h-5 w-5" />,
  image: <Image className="h-5 w-5" />,
};

const categoryLabels: Record<string, string> = {
  forms: 'Forms & Applications',
  scripts: 'Sales Scripts',
  presentations: 'Presentations',
  guides: 'Guides & Tutorials',
  carrier_materials: 'Carrier Materials',
  compliance: 'Compliance Documents',
  marketing: 'Marketing Materials',
  state_licensing: 'State Licensing',
};

const categoryColors: Record<string, string> = {
  forms: 'bg-blue-100 text-blue-800',
  scripts: 'bg-purple-100 text-purple-800',
  presentations: 'bg-green-100 text-green-800',
  guides: 'bg-yellow-100 text-yellow-800',
  carrier_materials: 'bg-orange-100 text-orange-800',
  compliance: 'bg-red-100 text-red-800',
  marketing: 'bg-pink-100 text-pink-800',
  state_licensing: 'bg-indigo-100 text-indigo-800',
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    async function fetchResources() {
      try {
        const params = new URLSearchParams();
        if (selectedCategory && selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }
        if (selectedType && selectedType !== 'all') {
          params.append('type', selectedType);
        }

        const res = await fetch(`/api/training/resources?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setResources(data.resources || []);
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchResources();
  }, [selectedCategory, selectedType]);

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Group resources by category
  const resourcesByCategory = filteredResources.reduce((acc, resource) => {
    const category = resource.resource_category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 max-w-sm" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/training">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resource Library</h1>
          <p className="text-muted-foreground">
            Documents, scripts, presentations, and more
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="document">Document</SelectItem>
            <SelectItem value="spreadsheet">Spreadsheet</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="link">Link</SelectItem>
            <SelectItem value="image">Image</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resources */}
      {filteredResources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Resources Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory !== 'all' || selectedType !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No resources are available yet.'}
            </p>
          </CardContent>
        </Card>
      ) : selectedCategory === 'all' ? (
        // Grouped by category view
        <div className="space-y-8">
          {Object.entries(resourcesByCategory).map(([category, categoryResources]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={categoryColors[category] || 'bg-gray-100 text-gray-800'}>
                  {categoryLabels[category] || category}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {categoryResources.length} resource{categoryResources.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid gap-3">
                {categoryResources.map(resource => (
                  <ResourceCard key={resource.id} resource={resource} formatFileSize={formatFileSize} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Flat list view (when category is selected)
        <div className="grid gap-3">
          {filteredResources.map(resource => (
            <ResourceCard key={resource.id} resource={resource} formatFileSize={formatFileSize} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ResourceCardProps {
  resource: Resource;
  formatFileSize: (bytes: number | null) => string;
}

function ResourceCard({ resource, formatFileSize }: ResourceCardProps) {
  const hasFile = !!resource.file_url;
  const hasLink = !!resource.external_url;

  const handleDownload = async () => {
    if (resource.file_url) {
      window.open(resource.file_url, '_blank');
    } else if (resource.external_url) {
      window.open(resource.external_url, '_blank');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {resourceTypeIcons[resource.resource_type] || <FileText className="h-5 w-5" />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{resource.title}</h3>
            {resource.description && (
              <p className="text-sm text-muted-foreground truncate">
                {resource.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="uppercase">{resource.resource_type}</span>
              {resource.file_size_bytes && (
                <span>{formatFileSize(resource.file_size_bytes)}</span>
              )}
              {resource.download_count && resource.download_count > 0 && (
                <span>{resource.download_count} downloads</span>
              )}
            </div>
          </div>

          {/* Tags */}
          {resource.tags && (resource.tags as string[]).length > 0 && (
            <div className="hidden md:flex gap-1 flex-wrap max-w-48">
              {(resource.tags as string[]).slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex-shrink-0 flex gap-2">
            {hasFile && resource.is_downloadable && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            {hasLink && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
            )}
            {hasFile && !resource.is_downloadable && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
