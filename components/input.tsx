"use client";

import React, { useRef, useState } from "react";
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Tooltip,
  CopyButton,
  Space,
} from "@mantine/core";

const editableStyle: React.CSSProperties = {
  width: "600px",
  height: "200px",
  borderRadius: "5px",
  resize: "both",
  overflow: "auto",
  textAlign: "left",
  fontFamily: "monospace",
  backgroundColor: "#2F3136",
  color: "#B9BBBE",
  border: "1px solid #202225",
  padding: "5px",
  whiteSpace: "pre-wrap",
  fontSize: "0.875rem",
  lineHeight: "1.125rem",
  margin: "auto"
};

const tooltipTexts: Record<string, string> = {
    "30": "#4f545c", // Dark Gray (33%)
    "31": "#dc322f", // Red
    "32": "#859900", // Yellowish Green
    "33": "#b58900", // Gold
    "34": "#268bd2", // Light Blue
    "35": "#d33682", // Pink
    "36": "#2aa198", // Teal
    "37": "#ffffff", // White
    "40": "#002b36", // Blueish Black
    "41": "#cb4b16", // Rust Brown
    "42": "#586e75", // Gray (40%)
    "43": "#657b83", // Gray (45%)
    "44": "#839496", // Light Gray (55%)
    "45": "#6c71c4", // Blurple
    "46": "#93a1a1", // Light Gray (60%)
    "47": "#fdf6e3", // Cream White
  };
  

const ansiButtons = [
  { code: "0", label: "Reset All", tooltip: "Reset" },
  { code: "1", label: "Bold", tooltip: "Bold" },
  { code: "4", label: "Line", tooltip: "Underline" },
];

const fgButtons = ["30", "31", "32", "33", "34", "35", "36", "37"];
const bgButtons = ["40", "41", "42", "43", "44", "45", "46", "47"];


function nodesToANSI(nodes: NodeList, states: Array<{ fg: number; bg: number; st: number }>): string {
  let text = "";
  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
      return;
    }
    if (node.nodeName === "BR") {
      text += "\n";
      return;
    }
    // Get ANSI code from class name; expect className like "ansi-33"
    const classList = (node as HTMLElement).className.split(" ");
    const ansiClass = classList.find((cls) => cls.startsWith("ansi-"));
    if (!ansiClass) {
      text += nodesToANSI(node.childNodes, states);
      return;
    }
    const ansiCode = parseInt(ansiClass.split("-")[1], 10);
    const newState = { ...states[states.length - 1] };
    if (ansiCode < 30) newState.st = ansiCode;
    if (ansiCode >= 30 && ansiCode < 40) newState.fg = ansiCode;
    if (ansiCode >= 40) newState.bg = ansiCode;
    states.push(newState);
    text += `\x1b[${newState.st};${ansiCode >= 40 ? newState.bg : newState.fg}m`;
    text += nodesToANSI(node.childNodes, states);
    states.pop();
    text += `\x1b[0m`;
    // Restore previous states if needed
    const prev = states[states.length - 1];
    if (prev.fg !== 2) text += `\x1b[${prev.st};${prev.fg}m`;
    if (prev.bg !== 2) text += `\x1b[${prev.st};${prev.bg}m`;
  });
  return text;
}

export default function Textbox() {
  const [copyCount, setCopyCount] = useState(0);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const [copyMessage, setCopyMessage] = useState("Copy text as Discord formatted");

  // Handler for ANSI style buttons (including Reset, Bold, Underline)
  const handleStyleButtonClick = (ansi: string) => {
    if (!editableRef.current) return;
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    // If Reset All is clicked, simply replace innerHTML with plain text
    if (ansi === "0") {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;
      const range = selection.getRangeAt(0);
      // Capture the selected text
      const plainText = selection.toString();
      // Create a text node containing the plain text
      const textNode = document.createTextNode(plainText);
      // Replace the selected content with the plain text node
      range.deleteContents();
      range.insertNode(textNode);
      // Optionally, reselect the new plain text
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(textNode);
      selection.addRange(newRange);
      return;
    }
    
    const span = document.createElement("span");
    span.innerText = selection.toString();
    span.classList.add(`ansi-${ansi}`);
    range.deleteContents();
    range.insertNode(span);
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.addRange(newRange);
  };

  const handleColorButtonClick = (ansi: string) => {
    if (!editableRef.current) return;
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const text = selection.toString();
    if (!text) return;
    const span = document.createElement("span");
    span.innerText = text;
    span.classList.add(`ansi-${ansi}`);
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(span);
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.addRange(newRange);
  };

  const handleCopy = async () => {
    if (!editableRef.current) return;
    const ansiText =
      "```ansi\n" +
      nodesToANSI(editableRef.current.childNodes, [{ fg: 2, bg: 2, st: 2 }]) +
      "\n```";
    try {
      await navigator.clipboard.writeText(ansiText);
      
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
  
      const funnyCopyMessages = [
        "Copied!",
        "Double Copy!",
        "Triple Copy!",
        "Dominating!!",
        "Rampage!!",
        "Mega Copy!!",
        "Unstoppable!!",
        "Wicked Sick!!",
        "Monster Copy!!!",
        "GODLIKE!!!",
        "BEYOND GODLIKE!!!!",
        Array(16)
          .fill(0)
          .reduce(
            (p) => p + String.fromCharCode(Math.floor(Math.random() * 65535)),
            ""
          ),
      ];
  
      
      setCopyMessage(funnyCopyMessages[copyCount]);
      setCopyCount((prev) => Math.min(11, prev + 1));

      copyTimeoutRef.current = setTimeout(() => {
        setCopyCount(0);
        setCopyMessage("Copy text as Discord formatted");
      }, 2000);
    } catch (err) {
      console.log(err);
      if (copyCount <= 2) {
        alert("Copying failed for some reason, let's try showing an alert, maybe you can copy it instead.");
        alert(ansiText);
      }
    }
  };

  return (
    <>
    <style>
    {`
      .ansi-1 { font-weight: bold; }
      .ansi-4 { text-decoration: underline; }

      .ansi-30 { color: #4f545c; } /* Dark Gray */
      .ansi-31 { color: #dc322f; } /* Red */
      .ansi-32 { color: #859900; } /* Yellowish Green */
      .ansi-33 { color: #b58900; } /* Gold */
      .ansi-34 { color: #268bd2; } /* Light Blue */
      .ansi-35 { color: #d33682; } /* Pink */
      .ansi-36 { color: #2aa198; } /* Teal */
      .ansi-37 { color: #ffffff; } /* White */

      .ansi-40 { background-color: #002b36; } /* Blueish Black */
      .ansi-41 { background-color: #cb4b16; } /* Rust Brown */
      .ansi-42 { background-color: #586e75; } /* Gray */
      .ansi-43 { background-color: #657b83; } /* Gray */
      .ansi-44 { background-color: #839496; } /* Light Gray */
      .ansi-45 { background-color: #6c71c4; } /* Blurple */
      .ansi-46 { background-color: #93a1a1; } /* Light Gray */
      .ansi-47 { background-color: #fdf6e3; } /* Cream White */
    `}
  </style>
    <Container size={"screen"} my="xl" style={{display:"flex", textAlign:"center", flexDirection: "column", alignItems: "center"}}>
      <Title order={1} mb="md">
        Rebane&apos;s Discord <span style={{ color: "#5865F2" }}>Colored</span> Text Generator
      </Title>
      <Text mb="md">
        This is a simple app that creates colored Discord messages using ANSI color codes.
        Write your text, select parts to assign colors, then copy the result.
      </Text>
      <Text size="sm" mb="xl">
        Source code is available on{" "}
        <a href="https://gist.github.com/rebane2001/07f2d8e80df053c70a1576d27eabe97c" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </Text>

      <Group justify="center" mb="sm">
        {ansiButtons.map((btn) => (
          <Button key={btn.code} onClick={() => handleStyleButtonClick(btn.code)}>
            {btn.label}
          </Button>
        ))}
      </Group>

      <Space h="lg" />

      <div style={{ display: "flex", alignItems: "center" }}>
        <Text >FG</Text>
        <Group mb="sm">
          {fgButtons.map((code) => (
            <Tooltip key={code} label={tooltipTexts[code] || code} withArrow>
              <Button
                style={{ backgroundColor: tooltipTexts[code]}}
                onClick={() => handleColorButtonClick(code)}
              >
                &nbsp;
              </Button>
            </Tooltip>
          ))}
        </Group>
      </div>

      <div style={{display: "flex", alignItems:"center"}}>
      <Text fw={500}>BG</Text>
      <Group justify="center" mb="sm">
        {bgButtons.map((code) => (
          <Tooltip key={code} label={tooltipTexts[code] || code} withArrow>
            <Button style={{backgroundColor: tooltipTexts[code]}} onClick={() => handleColorButtonClick(code)}>&nbsp;</Button>
          </Tooltip>
        ))}
      </Group>
      </div>
      <Space h="xl">&nbsp;</Space>

      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        style={editableStyle}
        
        dangerouslySetInnerHTML={{
          __html:
            "Welcome to&nbsp;<span class='ansi-33'>Rebane</span>'s <span class='ansi-45'><span class='ansi-37'>Discord</span></span>&nbsp;<span class='ansi-31'>C</span><span class='ansi-32'>o</span><span class='ansi-33'>l</span><span class='ansi-34'>o</span><span class='ansi-35'>r</span><span class='ansi-36'>e</span><span class='ansi-37'>d</span>&nbsp;Text Generator!",
        }}
      />

      <Space h="xl">&nbsp;</Space>

      <CopyButton value="">
        {() => (
          <Button onClick={handleCopy} variant="filled">
            {copyMessage}
          </Button>
        )}
      </CopyButton>

      <Space h="md" />
      <Text size="xs" color="dimmed">
        This is an unofficial tool, it is not made or endorsed by Discord.
      </Text>
    </Container>
    </>
  );
}
