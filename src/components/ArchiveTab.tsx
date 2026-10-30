'use client';

import React, { useState } from 'react';
import { BookOpen, MapPin, UserCheck, Scroll, Calendar } from 'lucide-react';
import { soundFX } from '@/lib/audio';

export const ArchiveTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'lore' | 'roles' | 'schedule'>('lore');

  return (
    <div className="space-y-6 font-serif">
      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-[#5c3e21] pb-3 font-cinzel text-xs">
        <button
          onClick={() => {
            soundFX.playKeyClick();
            setActiveSection('lore');
          }}
          className={`py-2 px-3 rounded-lg font-bold border transition ${
            activeSection === 'lore'
              ? 'bg-[#422c15] text-[#fbbf24] border-[#d4af37] shadow-md'
              : 'bg-[#18110a] text-[#a88456] border-[#4a3219]'
          }`}
        >
          📜 Pelin Runkotarina 1888
        </button>
        <button
          onClick={() => {
            soundFX.playKeyClick();
            setActiveSection('roles');
          }}
          className={`py-2 px-3 rounded-lg font-bold border transition ${
            activeSection === 'roles'
              ? 'bg-[#422c15] text-[#fbbf24] border-[#d4af37] shadow-md'
              : 'bg-[#18110a] text-[#a88456] border-[#4a3219]'
          }`}
        >
          👥 Sukulaisten Roolit
        </button>
        <button
          onClick={() => {
            soundFX.playKeyClick();
            setActiveSection('schedule');
          }}
          className={`py-2 px-3 rounded-lg font-bold border transition ${
            activeSection === 'schedule'
              ? 'bg-[#422c15] text-[#fbbf24] border-[#d4af37] shadow-md'
              : 'bg-[#18110a] text-[#a88456] border-[#4a3219]'
          }`}
        >
          🗓️ Lokakuun Aikataulu
        </button>
      </div>

      {activeSection === 'lore' && (
        <div className="space-y-4 text-xs text-[#e4cdad] leading-relaxed">
          <div className="paper-document p-5 rounded-xl text-[#2b1d0c] shadow-2xl relative">
            <div className="wax-seal w-9 h-9 absolute top-3 right-3 font-gothic text-xs font-bold">
              1888
            </div>
            <h3 className="text-base font-bold font-cinzel text-[#3d240f] mb-3">
              TAPAUS VÄRILÄ – PROTOKOLLA 1888
            </h3>
            <p className="mb-3 italic">
              Lokakuussa 1888 Nuoramoisten pappilassa (Värilän virkatalossa) toiminut kappalainen kätki 
              pappilan maille sinetöidyn arkun ja virkatalon arvokkaimmat dokumentit ennen äkillistä 
              katoamistaan matkalla Lahden kautta Heinolaan.
            </p>
            <p className="mb-3 italic">
              Hän jakoi salaisuuden osiin siten, että kukaan yksittäinen ihminen ei voisi murtaa sitä: 
              vain hänen luotettujensa jälkeläiset – eri elämänalojen ja taitojen taitajat – pystyisivät 
              yhdessä purkamaan suojaukset pyhäinpäivän aattona Nuoramoisissa.
            </p>
            <p className="italic">
              Nyt lokakuussa sukulaisten puhelimiin ja terminaaleihin aktivoituu vanha viestikanava: 
              <strong className="font-bold text-[#7f1d1d]"> &quot;Arkistonhoitaja&quot;</strong> ilmoittaa, 
              että 138 vuotta vanha sinetti alkaa murtua.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 font-serif">
            <div className="parchment-card p-4 rounded-xl border border-[#5c3e21]">
              <span className="text-[#fbbf24] font-bold font-cinzel block mb-1.5 text-xs">📍 LAHTI (Asko & Radiomäki)</span>
              <p className="text-xs text-[#e4cdad] leading-relaxed">
                Konepajayhteys, höyrykoneen akselin kierteet ja rautatieliikenne 1888.
              </p>
            </div>
            <div className="parchment-card p-4 rounded-xl border border-[#5c3e21]">
              <span className="text-[#fbbf24] font-bold font-cinzel block mb-1.5 text-xs">📍 HEINOLA (Maaherranpuisto)</span>
              <p className="text-xs text-[#e4cdad] leading-relaxed">
                Apteekkarin tinktuurareseptit, vanha puukirkko ja Värilän musta kirjanpito.
              </p>
            </div>
            <div className="parchment-card p-4 rounded-xl border border-[#5c3e21]">
              <span className="text-[#fbbf24] font-bold font-cinzel block mb-1.5 text-xs">📍 SYSMÄ (Nuoramoiset)</span>
              <p className="text-xs text-[#e4cdad] leading-relaxed">
                Värilän virkatalon piha, aitta, monilukkoarkku ja finaalin juhlallisuudet.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'roles' && (
        <div className="space-y-3">
          <div className="p-3.5 bg-[#18110a] border border-[#4a3219] rounded-lg text-xs text-[#e4cdad] mb-3">
            Pelin tehtävät on personoitu suvun eri taitajille, jotta jokaisen osaamista tarvitaan arkun murtamiseen:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="parchment-card p-4 rounded-xl border border-[#5c3e21]">
              <div className="text-[#fbbf24] font-bold font-cinzel mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#d4af37]" />
                <span>Konepajamyyjä & Nuorempi asentaja</span>
              </div>
              <p className="text-[#e4cdad] text-xs leading-relaxed">
                Höyrykoneen akselin räjäytyskuvan murtolujuudet, kierrekoot ja finaalin kirstun mekaanisten sokkien purku.
              </p>
            </div>

            <div className="parchment-card p-4 rounded-xl border border-[#5c3e21]">
              <div className="text-[#fbbf24] font-bold font-cinzel mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#d4af37]" />
                <span>Päihdehoitaja & Lastenpsykiatrian hoitaja</span>
              </div>
              <p className="text-[#e4cdad] text-xs leading-relaxed">
                Latinankieliset apteekkarin tinktuurareseptit, rohdosmitat ja päiväkirjamerkintöjen tulkinta.
              </p>
            </div>

            <div className="parchment-card p-4 rounded-xl border border-[#5c3e21]">
              <div className="text-[#fbbf24] font-bold font-cinzel mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#d4af37]" />
                <span>Tilintarkastaja & Merkonomiteini</span>
              </div>
              <p className="text-[#e4cdad] text-xs leading-relaxed">
                Vuoden 1888 tase-epäselvyyksien selvitys ja minuuttikellon tikityksessä tehtävä tase-erotuslaskenta.
              </p>
            </div>

            <div className="parchment-card p-4 rounded-xl border border-[#5c3e21]">
              <div className="text-[#fbbf24] font-bold font-cinzel mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#d4af37]" />
                <span>Kutoja & Cheerleader-teini & Lapset</span>
              </div>
              <p className="text-[#e4cdad] text-xs leading-relaxed">
                Kuvioneuleen silmukkarytmit, liikekaaviot, Kirvesvartijan (Tappara) vaakuna ja taskulamppuetsintä salissa.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'schedule' && (
        <div className="space-y-3 font-serif text-xs">
          <div className="parchment-card p-4 border-l-4 border-l-[#d4af37] rounded-xl">
            <span className="text-[#fbbf24] font-bold font-cinzel block text-sm">VIIKKO 1: Herätys & Lahden Asko</span>
            <p className="text-[#e4cdad] mt-1 leading-relaxed">
              Kutsukirje aktivoituu. NFC kätketty Askon tehdasalueelle. Vapautuu konepajan höyrykonepulma.
            </p>
          </div>

          <div className="parchment-card p-4 border-l-4 border-l-[#d4af37] rounded-xl">
            <span className="text-[#fbbf24] font-bold font-cinzel block text-sm">VIIKKO 2: Heinolan Rohdokset & Musta Kirjanpito</span>
            <p className="text-[#e4cdad] mt-1 leading-relaxed">
              NFC kätketty Maaherranpuiston tai vanhan puukirkon lyhdyn jalkaan. Vapautuvat rohdos- ja tasepulmat.
            </p>
          </div>

          <div className="parchment-card p-4 border-l-4 border-l-[#d4af37] rounded-xl">
            <span className="text-[#fbbf24] font-bold font-cinzel block text-sm">VIIKKO 3: Salainen Kuvio & Radiotaajuus</span>
            <p className="text-[#e4cdad] mt-1 leading-relaxed">
              NFC urheilukentän kaiteessa. Vapautuu analoginen taajuus- ja kohinaskanneri kohti Sysmää.
            </p>
          </div>

          <div className="parchment-card p-4 border-l-4 border-l-[#d4af37] rounded-xl">
            <span className="text-[#fbbf24] font-bold font-cinzel block text-sm">VIIKKO 4: Juhlapäivä & Nuoramoisten Monilukkoarkku</span>
            <p className="text-[#e4cdad] mt-1 leading-relaxed">
              Saapuminen Värilän virkataloon tietä 410 pitkin. Pihan NFC-kuittaus, sokkien purku ja kirstun avaus!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
