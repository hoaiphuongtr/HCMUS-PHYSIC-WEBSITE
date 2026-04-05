"use client";

import type { Config } from "@puckeditor/core";
import { Spacer, Divider, Card, Columns, Container, Grid, FooterBlock } from "./components/layout";
import { Navbar, NavLinks, QuickLinks, SocialIcons } from "./components/navigation";
import { Heading, TextBlock, IconText, SectionHeader, ContactInfo, NewsCard, ProfileCard, DepartmentCard } from "./components/content";
import { ImageBlock, ImageGallery, VideoEmbed, ImageSlider, LogoGrid, LogoSlider } from "./components/media";
import { ButtonBlock, Banner, AnnouncementBar, SearchOverlay, PersonaSelector, ChatButton } from "./components/interactive";
import { HeroFullScreen, StatsCounter } from "./components/hero";
import { NewsOverlayCard, EventCard } from "./components/cards";

export const puckConfig: Config = {
  categories: {
    layout: {
      title: "Layout",
      components: [
        "Container",
        "Columns",
        "Grid",
        "Card",
        "FooterBlock",
        "Spacer",
        "Divider",
      ],
    },
    navigation: {
      title: "Navigation",
      components: ["Navbar", "NavLinks", "QuickLinks", "SocialIcons"],
    },
    content: {
      title: "Content",
      components: [
        "SectionHeader",
        "NewsCard",
        "ProfileCard",
        "DepartmentCard",
        "Heading",
        "TextBlock",
        "IconText",
        "ContactInfo",
      ],
    },
    media: {
      title: "Media",
      components: [
        "ImageSlider",
        "ImageBlock",
        "ImageGallery",
        "LogoGrid",
        "LogoSlider",
        "VideoEmbed",
      ],
    },
    interactive: {
      title: "Interactive",
      components: ["ButtonBlock", "Banner", "AnnouncementBar", "SearchOverlay", "PersonaSelector", "ChatButton"],
    },
    hero: {
      title: "Hero & Stats",
      components: ["HeroFullScreen", "StatsCounter"],
    },
    cards: {
      title: "Cards",
      components: ["NewsOverlayCard", "EventCard"],
    },
  },
  components: {
    Heading,
    TextBlock,
    ImageBlock,
    ButtonBlock,
    Spacer,
    Divider,
    Card,
    IconText,
    Banner,
    NavLinks,
    Columns,
    Container,
    Grid,
    ImageGallery,
    VideoEmbed,
    ImageSlider,
    SectionHeader,
    NewsCard,
    ProfileCard,
    LogoGrid,
    LogoSlider,
    FooterBlock,
    SocialIcons,
    ContactInfo,
    AnnouncementBar,
    Navbar,
    QuickLinks,
    DepartmentCard,
    SearchOverlay,
    HeroFullScreen,
    StatsCounter,
    NewsOverlayCard,
    EventCard,
    PersonaSelector,
    ChatButton,
  } as any,
};
