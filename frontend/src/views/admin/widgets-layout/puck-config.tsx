"use client";

import type { Config } from "@puckeditor/core";
import { EventCard, NewsOverlayCard } from "./components/cards";
import {
  ContactInfo,
  DepartmentCard,
  Heading,
  IconText,
  NewsCard,
  ProfileCard,
  SectionHeader,
  TextBlock,
} from "./components/content";
import { HeroFullScreen, StatsCounter } from "./components/hero";
import {
  AnnouncementBar,
  Banner,
  ButtonBlock,
  ChatButton,
  PersonaSelector,
  SearchOverlay,
} from "./components/interactive";
import {
  Card,
  Columns,
  Container,
  Divider,
  FooterBlock,
  Grid,
  Spacer,
} from "./components/layout";
import {
  ImageBlock,
  ImageGallery,
  ImageSlider,
  LogoGrid,
  LogoSlider,
  VideoEmbed,
} from "./components/media";
import {
  Navbar,
  NavLinks,
  QuickLinks,
  SocialIcons,
} from "./components/navigation";

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
      components: [
        "ButtonBlock",
        "Banner",
        "AnnouncementBar",
        "SearchOverlay",
        "PersonaSelector",
        "ChatButton",
      ],
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
