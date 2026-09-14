"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import { CopyCheckIcon, CopyIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/hint";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { convertFilesToTreeItems } from "@/lib/utils";
import { CodeView } from "./code-view";
import { TreeView } from "./tree-view";

/**
 * Breadcrumb trail for the currently selected file path.
 *
 * Renders each path segment when the path is short; for deep paths it collapses
 * the middle with an ellipsis, keeping the first and last segments.
 *
 * @param filePath - The selected file's full path (slash-separated).
 */
function FileBreadcrumb({ filePath }: { filePath: string }) {
  const pathSegments = filePath.split("/");
  const maxSegments = 4;

  if (pathSegments.length <= maxSegments) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          {pathSegments.map((segment, index) => {
            const isLast = index === pathSegments.length - 1;

            return (
              <Fragment key={`${segment}-${index}`}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{segment}</BreadcrumbPage>
                  ) : (
                    <span className="text-muted-foreground">{segment}</span>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const firstSegment = pathSegments[0];
  const lastSegment = pathSegments[pathSegments.length - 1];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <span className="text-muted-foreground">{firstSegment}</span>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem className="font-medium">{lastSegment}</BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * Map a filename's extension to a Prism language id for highlighting.
 *
 * @param filename - The file name or path to inspect.
 * @returns A Prism language id, or `"text"` when the extension is unknown.
 */
function getLanguageFromExtension(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
  };

  return languageMap[extension || ""] || "text";
}

/**
 * Two-pane file explorer for a generated fragment.
 *
 * The left resizable pane shows a {@link TreeView} of files; the right pane
 * shows the selected file via {@link CodeView}, with a breadcrumb and a
 * copy-to-clipboard button. Selects the first file by default.
 *
 * @param files - Map of file path to file contents to browse.
 */
export function FileExplorer({ files }: { files: Record<string, string> }) {
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(() => {
    const fileKeys = Object.keys(files);
    return fileKeys.length > 0 ? fileKeys[0] : null;
  });

  const treeData = useMemo(() => convertFilesToTreeItems(files), [files]);

  const handleFileSelect = useCallback(
    (filePath: string) => {
      if (files[filePath]) {
        setSelectedFile(filePath);
      }
    },
    [files]
  );

  const handleCopy = useCallback(() => {
    if (selectedFile && files[selectedFile]) {
      navigator.clipboard
        .writeText(files[selectedFile])
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((copyError) => {
          console.error("Failed to copy:", copyError);
        });
    }
  }, [selectedFile, files]);

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
      <ResizablePanel
        defaultSize={22}

        className="bg-sidebar min-w-[220px]"
      >
        <TreeView
          data={treeData}
          value={selectedFile}
          onSelect={handleFileSelect}
        />
      </ResizablePanel>
      <ResizableHandle className="hover:bg-primary/40 bg-border w-px transition-colors" />

      <ResizablePanel defaultSize={78} minSize={55} className="min-w-0">
        {selectedFile && files[selectedFile] ? (
          <div className="flex flex-col w-full h-full min-h-0">
            <div className="flex justify-between items-center gap-x-2 bg-sidebar/50 px-4 py-2 border-b shrink-0">
              <FileBreadcrumb filePath={selectedFile} />
              <Hint text="Copy to clipboard" side="bottom">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-background/80 w-8 h-8"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <CopyCheckIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <CopyIcon className="w-4 h-4" />
                  )}
                </Button>
              </Hint>
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              <CodeView
                code={files[selectedFile]}
                lang={getLanguageFromExtension(selectedFile)}
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <p className="text-sm">Select a file to view its content</p>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
