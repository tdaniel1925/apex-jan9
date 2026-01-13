'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Play,
  Copy,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Code2,
  BookOpen,
  FileCode,
  Search,
  Loader2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Simple ScrollArea replacement (since we don't have the shadcn scroll-area component)
function ScrollArea({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('overflow-auto', className)}>{children}</div>;
}

interface SampleRequest {
  id: string;
  name: string;
  category: string;
  description: string;
  xml: string;
  notes: string;
}

interface DictionaryObject {
  description: string;
  properties: {
    confirmed: string[];
    nested: Record<string, string[]>;
    notFound: string[];
  };
  notes: string[];
}

interface ExplorerResponse {
  success: boolean;
  requestXml: string;
  responseXml: string;
  parsedResponse: Record<string, unknown>;
  executionTime: number;
  timestamp: string;
}

interface DiscoverResponse {
  object: string;
  property: string;
  exists: boolean;
  errorCode?: string;
  errorMessage?: string;
  rawResponse: string;
  recommendation: string;
}

export function SmartOfficeDeveloperTools() {
  const [activeTab, setActiveTab] = useState('explorer');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Developer Tools</h2>
          <p className="text-muted-foreground">
            Tools to help you understand and work with the SmartOffice API
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="explorer" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            API Explorer
          </TabsTrigger>
          <TabsTrigger value="dictionary" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Dictionary
          </TabsTrigger>
          <TabsTrigger value="samples" className="flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Samples
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="explorer">
          <APIExplorer />
        </TabsContent>

        <TabsContent value="dictionary">
          <ObjectDictionary />
        </TabsContent>

        <TabsContent value="samples">
          <SampleRequestsLibrary onSelect={(xml) => {
            setActiveTab('explorer');
            // We'll pass this to the explorer via localStorage for simplicity
            localStorage.setItem('smartoffice_explorer_xml', xml);
            window.dispatchEvent(new Event('smartoffice_xml_update'));
          }} />
        </TabsContent>

        <TabsContent value="discover">
          <PropertyDiscovery />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function APIExplorer() {
  const [xml, setXml] = useState('');
  const [response, setResponse] = useState<ExplorerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for XML updates from Samples tab
  useEffect(() => {
    const handleUpdate = () => {
      const storedXml = localStorage.getItem('smartoffice_explorer_xml');
      if (storedXml) {
        setXml(storedXml);
        localStorage.removeItem('smartoffice_explorer_xml');
      }
    };

    window.addEventListener('smartoffice_xml_update', handleUpdate);
    handleUpdate(); // Check on mount

    return () => window.removeEventListener('smartoffice_xml_update', handleUpdate);
  }, []);

  const executeRequest = async () => {
    if (!xml.trim()) {
      setError('Please enter an XML request');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/admin/smartoffice/explorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Request failed');
      }

      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Request XML
          </CardTitle>
          <CardDescription>
            Enter your SmartOffice XML request here
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={xml}
            onChange={(e) => setXml(e.target.value)}
            placeholder={`<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
  </header>
  <!-- Your request here -->
</request>`}
            className="font-mono text-sm min-h-[400px]"
          />
          <div className="flex gap-2">
            <Button onClick={executeRequest} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Execute Request
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setXml('')}>
              Clear
            </Button>
          </div>
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-start gap-2">
              <XCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Response
            </span>
            {response && (
              <div className="flex items-center gap-2 text-sm font-normal">
                <Clock className="h-4 w-4" />
                {response.executionTime}ms
              </div>
            )}
          </CardTitle>
          <CardDescription>
            SmartOffice API response will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!response && !loading && (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
              <Code2 className="h-12 w-12 mb-4 opacity-50" />
              <p>Execute a request to see the response</p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
              <Loader2 className="h-12 w-12 mb-4 animate-spin" />
              <p>Sending request to SmartOffice...</p>
            </div>
          )}
          {response && (
            <Tabs defaultValue="raw" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="raw">Raw XML</TabsTrigger>
                <TabsTrigger value="parsed">Parsed</TabsTrigger>
              </TabsList>
              <TabsContent value="raw" className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 z-10"
                  onClick={() => copyToClipboard(response.responseXml)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <ScrollArea className="h-[350px]">
                  <pre className="font-mono text-xs bg-muted p-4 rounded-lg whitespace-pre-wrap">
                    {response.responseXml}
                  </pre>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="parsed" className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 z-10"
                  onClick={() => copyToClipboard(JSON.stringify(response.parsedResponse, null, 2))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <ScrollArea className="h-[350px]">
                  <pre className="font-mono text-xs bg-muted p-4 rounded-lg whitespace-pre-wrap">
                    {JSON.stringify(response.parsedResponse, null, 2)}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ObjectDictionary() {
  const [dictionary, setDictionary] = useState<{
    objects: Record<string, DictionaryObject>;
    notes: string[];
    lastUpdated: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/smartoffice/dictionary')
      .then((res) => res.json())
      .then((data) => {
        setDictionary(data);
        setSelectedObject(Object.keys(data.objects)[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!dictionary) return null;

  const currentObject = selectedObject ? dictionary.objects[selectedObject] : null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Objects</CardTitle>
          <CardDescription>Available SmartOffice objects</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {Object.entries(dictionary.objects).map(([name, obj]) => (
              <button
                key={name}
                className={cn(
                  'w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center justify-between',
                  selectedObject === name && 'bg-muted'
                )}
                onClick={() => setSelectedObject(name)}
              >
                <div>
                  <div className="font-medium">{name}</div>
                  <div className="text-xs text-muted-foreground">{obj.description}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {selectedObject || 'Select an Object'}
          </CardTitle>
          <CardDescription>
            {currentObject?.description || 'Click an object to view its properties'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentObject && (
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-6">
                {/* Confirmed Properties */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Confirmed Properties
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentObject.properties.confirmed.map((prop) => (
                      <Badge key={prop} variant="secondary" className="font-mono">
                        {prop}
                      </Badge>
                    ))}
                    {currentObject.properties.confirmed.length === 0 && (
                      <span className="text-sm text-muted-foreground">None discovered yet</span>
                    )}
                  </div>
                </div>

                {/* Nested Properties */}
                {Object.keys(currentObject.properties.nested).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-blue-500" />
                      Nested Properties
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(currentObject.properties.nested).map(([path, props]) => (
                        <div key={path} className="bg-muted p-3 rounded-lg">
                          <div className="font-mono text-sm text-muted-foreground mb-2">
                            {path}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {props.map((prop) => (
                              <Badge key={prop} variant="outline" className="font-mono">
                                {prop}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Not Found */}
                {currentObject.properties.notFound.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Properties Not Found (error 4001)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentObject.properties.notFound.map((prop) => (
                        <Badge key={prop} variant="destructive" className="font-mono opacity-60">
                          {prop}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      These properties returned errors when queried. They may not exist or require a different access method.
                    </p>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    Notes
                  </h4>
                  <ul className="space-y-1">
                    {currentObject.notes.map((note, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-muted-foreground/50">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SampleRequestsLibrary({ onSelect }: { onSelect: (xml: string) => void }) {
  const [samples, setSamples] = useState<{
    grouped: Record<string, SampleRequest[]>;
    categories: string[];
    usage: { steps: string[]; tips: string[] };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<SampleRequest | null>(null);

  useEffect(() => {
    fetch('/api/admin/smartoffice/samples')
      .then((res) => res.json())
      .then((data) => {
        setSamples(data);
        setSelectedCategory(data.categories[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!samples) return null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Sample Requests</CardTitle>
          <CardDescription>Pre-built examples to get started</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[450px]">
            {samples.categories.map((category) => (
              <div key={category}>
                <div className="px-4 py-2 bg-muted/50 font-medium text-sm">
                  {category}
                </div>
                <div className="divide-y">
                  {samples.grouped[category]?.map((sample) => (
                    <button
                      key={sample.id}
                      className={cn(
                        'w-full px-4 py-3 text-left hover:bg-muted transition-colors',
                        selectedSample?.id === sample.id && 'bg-muted'
                      )}
                      onClick={() => setSelectedSample(sample)}
                    >
                      <div className="font-medium text-sm">{sample.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {sample.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        {selectedSample ? (
          <>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedSample.name}</CardTitle>
                  <CardDescription>{selectedSample.description}</CardDescription>
                </div>
                <Button onClick={() => onSelect(selectedSample.xml)}>
                  <Play className="mr-2 h-4 w-4" />
                  Use in Explorer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px]">
                <pre className="font-mono text-xs bg-muted p-4 rounded-lg whitespace-pre-wrap">
                  {selectedSample.xml}
                </pre>
              </ScrollArea>
              <Separator className="my-4" />
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{selectedSample.notes}</span>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex flex-col items-center justify-center h-[450px]">
            <FileCode className="h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">Select a sample to view</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function PropertyDiscovery() {
  const [object, setObject] = useState('Agent');
  const [property, setProperty] = useState('');
  const [result, setResult] = useState<DiscoverResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<DiscoverResponse[]>([]);

  const discover = async () => {
    if (!object.trim() || !property.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/smartoffice/dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object, property }),
      });

      const data = await res.json();
      setResult(data);
      setHistory((prev) => [data, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Property Discovery
          </CardTitle>
          <CardDescription>
            Test if a property exists on a SmartOffice object
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Object Name</label>
            <Input
              value={object}
              onChange={(e) => setObject(e.target.value)}
              placeholder="e.g., Agent, Contact, Policy"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Property Name</label>
            <Input
              value={property}
              onChange={(e) => setProperty(e.target.value)}
              placeholder="e.g., WritingNo, NPN, Status"
              onKeyDown={(e) => e.key === 'Enter' && discover()}
            />
          </div>
          <Button onClick={discover} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Test Property
              </>
            )}
          </Button>

          {result && (
            <div
              className={cn(
                'p-4 rounded-lg',
                result.exists ? 'bg-green-500/10' : 'bg-red-500/10'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.exists ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {result.object}.{result.property}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{result.recommendation}</p>
              {result.errorCode && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error: {result.errorCode} - {result.errorMessage}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Discovery History</CardTitle>
          <CardDescription>Recent property tests</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Search className="h-12 w-12 mb-4 opacity-50" />
              <p>No discoveries yet</p>
              <p className="text-sm">Test some properties to build history</p>
            </div>
          ) : (
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {history.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {item.exists ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-mono text-sm">
                        {item.object}.{item.property}
                      </span>
                    </div>
                    <Badge variant={item.exists ? 'default' : 'secondary'}>
                      {item.exists ? 'Exists' : 'Not Found'}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
