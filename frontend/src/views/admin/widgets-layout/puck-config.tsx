"use client";

import type { Config } from "@puckeditor/core";
import { EventCard, NewsOverlayCard } from "./components/cards";
import {
  ContactInfo,
  DepartmentCard,
  Heading,
  IconText,
  ImageTextBlock,
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
  SearchOverlay,
} from "./components/interactive";
import { ScholarshipList } from "./components/scholarship";
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
  MapEmbed,
  PartnerShowcase,
  VideoEmbed,
} from "./components/media";
import {
  LanguageSwitcher,
  Navbar,
  NavLinks,
  QuickLinks,
  SocialIcons,
} from "./components/navigation";
import {
  LatestNewsAuto,
  NewsListPaginated,
  UpcomingEventsAuto,
} from "./components/news-feed";
import {
  PostBody,
  PostCoverImage,
  PostEventInfo,
  PostHeader,
  PostReaderTools,
  PostTagList,
  PostTitle,
} from "./components/post-placeholders";
import { Footer, Header } from "./components/site-syndication";
import {
  LegacyPageBody,
  PageHero,
  StaffProfile,
} from "./components/legacy-page";
import { ChatBubble } from "./components/chat-bubble";

export const puckConfig: Config = {
  categories: {
    layout: {
      title: "Layout",
      components: [
        "Card",
        "Columns",
        "Container",
        "Divider",
        "FooterBlock",
        "Grid",
        "Spacer",
      ],
    },
    navigation: {
      title: "Navigation",
      components: [
        "Header",
        "LanguageSwitcher",
        "Navbar",
        "NavLinks",
        "QuickLinks",
        "SocialIcons",
      ],
    },
    content: {
      title: "Content",
      components: [
        "ContactInfo",
        "DepartmentCard",
        "Heading",
        "IconText",
        "ImageTextBlock",
        "NewsCard",
        "ProfileCard",
        "SectionHeader",
        "TextBlock",
      ],
    },
    media: {
      title: "Media",
      components: [
        "ImageBlock",
        "ImageGallery",
        "ImageSlider",
        "LogoGrid",
        "LogoSlider",
        "MapEmbed",
        "PartnerShowcase",
        "VideoEmbed",
      ],
    },
    interactive: {
      title: "Interactive",
      components: [
        "AnnouncementBar",
        "Banner",
        "ButtonBlock",
        "ChatBubble",
        "ScholarshipList",
        "SearchOverlay",
      ],
    },
    hero: {
      title: "Hero & Stats",
      components: ["HeroFullScreen", "StatsCounter"],
    },
    cards: {
      title: "Cards",
      components: [
        "EventCard",
        "LatestNewsAuto",
        "NewsListPaginated",
        "NewsOverlayCard",
        "UpcomingEventsAuto",
      ],
    },
    post: {
      title: "Post Placeholders",
      components: [
        "PostBody",
        "PostCoverImage",
        "PostEventInfo",
        "PostHeader",
        "PostReaderTools",
        "PostTagList",
        "PostTitle",
      ],
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
    MapEmbed,
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
    LanguageSwitcher,
    DepartmentCard,
    SearchOverlay,
    HeroFullScreen,
    StatsCounter,
    NewsOverlayCard,
    EventCard,
    ImageTextBlock,
    LatestNewsAuto,
    UpcomingEventsAuto,
    NewsListPaginated,
    PartnerShowcase,
    ScholarshipList,
    PostTitle,
    PostBody,
    PostCoverImage,
    PostTagList,
    PostEventInfo,
    PostHeader,
    PostReaderTools,
    Header,
    Footer,
    PageHero,
    LegacyPageBody,
    StaffProfile,
    ChatBubble,
  } as any,
};
