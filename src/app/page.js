"use client";

import "./app.css";
import { useState, useEffect, useMemo } from "react";
import { loadClients, loadInstances, loadGuilds } from "../utils/itemLoaders";
import { copyToClipboard } from "../utils/clipboard";
import { useImageGallery } from "../hooks/useImageGallery";
import { useFilters } from "../hooks/useFilters";
import Header from "../components/Header";
import TabBar from "../components/TabBar";
import FilterBar from "../components/FilterBar";
import TagMenu from "../components/TagMenu";
import ItemCard from "../components/ItemCard";
import ItemModal from "../components/ItemModal";

const TABS = [
  { id: 'clients', label: 'Clients' },
  { id: 'instances', label: 'Instances' },
  { id: 'guilds', label: 'Guilds' }
];


export default function Home() {
  const [clients] = useState(loadClients());
  const [instances] = useState(loadInstances());
  const [guilds] = useState(loadGuilds());
  const [activeTab, setActiveTab] = useState("clients");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [copiedText, setCopiedText] = useState(null);
  const [, setIsMounted] = useState(false);
  

  const filters = useFilters();
  const selectedItem = selectedClient || selectedInstance || selectedGuild;
  const imageGallery = useImageGallery(selectedItem);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  

  function handleCopyToClipboard(text) {
    copyToClipboard(text, (copiedValue) => {
      setCopiedText(copiedValue);
      setTimeout(() => setCopiedText(null), 2000);
    });
  }

  function openClient(clientObj) {
    setSelectedClient(clientObj);
    setSelectedInstance(null);
    setSelectedGuild(null);
  }

  function openInstance(instanceObj) {
    setSelectedInstance(instanceObj);
    setSelectedClient(null);
    setSelectedGuild(null);
  }

  function openGuild(guildObj) {
    setSelectedGuild(guildObj);
    setSelectedClient(null);
    setSelectedInstance(null);
  }

  function closeModal() {
    setSelectedClient(null);
    setSelectedInstance(null);
    setSelectedGuild(null);
  }

  function handleCardClick(e, item, type) {
    const disallowed = e.target.closest('button, a, svg, input, textarea, select') 
      || e.target.closest('.tag-pill') 
      || e.target.closest('.star-rating');
    if (disallowed) return;
    
    if (type === 'client') openClient(item);
    else if (type === 'instance') openInstance(item);
    else if (type === 'guild') openGuild(item);
  }

  const activeItems = activeTab === 'clients' ? clients : activeTab === 'instances' ? instances : guilds;
  const isClientTab = activeTab === 'clients';
  const filteredItems = useMemo(() => {
    return filters.filterAndSort(activeItems, isClientTab);
  }, [activeItems, isClientTab, filters.searchQuery, filters.statusFilter, filters.selectedIncludeTags, filters.selectedExcludeTags, filters.itemSort]);

  return (
    <main className="app-root flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <Header />
      
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />

      <section className="w-full max-w-[75em]">
        <FilterBar
          activeTab={activeTab}
          searchQuery={filters.searchQuery}
          setSearchQuery={filters.setSearchQuery}
          statusFilter={filters.statusFilter}
          setStatusFilter={filters.setStatusFilter}
          showTagMenu={filters.showTagMenu}
          setShowTagMenu={filters.setShowTagMenu}
          selectedIncludeTags={filters.selectedIncludeTags}
          setSelectedIncludeTags={filters.setSelectedIncludeTags}
          selectedExcludeTags={filters.selectedExcludeTags}
          setSelectedExcludeTags={filters.setSelectedExcludeTags}
          showStatusFilter={activeTab === 'clients'}
        />

        <TagMenu
          showTagMenu={filters.showTagMenu}
          activeItems={activeItems}
          selectedIncludeTags={filters.selectedIncludeTags}
          setSelectedIncludeTags={filters.setSelectedIncludeTags}
          selectedExcludeTags={filters.selectedExcludeTags}
          setSelectedExcludeTags={filters.setSelectedExcludeTags}
        />

        <div className="h-4" />

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: 
                activeTab === "clients" ? "translateX(0%)" : 
                activeTab === "instances" ? "translateX(-100%)" : 
                "translateX(-200%)",
            }}
          >
            {/* Clients */}
            <div className="min-w-full">
              <ul className="w-full space-y-4">
                {activeTab === 'clients' && filteredItems.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    type="client"
                    onCardClick={(e) => handleCardClick(e, item, 'client')}
                    onViewDetails={openClient}
                  />
                ))}
              </ul>
            </div>

            {/* Instances */}
            <div className="min-w-full">
              <ul className="w-full space-y-4">
                {activeTab === 'instances' && filteredItems.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    type="instance"
                    onCardClick={(e) => handleCardClick(e, item, 'instance')}
                    onViewDetails={openInstance}
                  />
                ))}
              </ul>
            </div>

            {/* Guilds */}
            <div className="min-w-full">
              <ul className="w-full space-y-4">
                {activeTab === 'guilds' && filteredItems.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    type="guild"
                    onCardClick={(e) => handleCardClick(e, item, 'guild')}
                    onViewDetails={openGuild}
                  />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full max-w-[75em] mt-6 mb-12 p-4 rounded-lg bg-[#071227]/60 border border-[#1f2937] text-sm text-[#cfcfe0]">
        <div>
          To suggest additional clients, instances, or guilds, please open an issue on GitHub:
          <a 
            href={`${(process.env.NEXT_PUBLIC_REPO_URL || 'https://github.com/oh64/spacebar-explorer').replace(/\/$/, '')}/issues`} 
            target="_blank" 
            rel="noreferrer" 
            className="text-[#06b6d4] underline ml-1"
          >
            Repository issues
          </a>
        </div>
      </div>

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          type={selectedClient ? 'client' : selectedGuild ? 'guild' : 'instance'}
          onClose={closeModal}
          selectedInstance={selectedInstance}
          copiedText={copiedText}
          copyToClipboard={handleCopyToClipboard}
          imageGalleryProps={imageGallery}
        />
      )}
    </main>
  );
}
