import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ChevronRight, 
  ChevronLeft, 
  AlertTriangle, 
  Sparkles, 
  Send, 
  Loader2, 
  ShieldAlert, 
  Save,
  Tag
} from 'lucide-react';
import AnimalImageUploader from '../components/farmer/AnimalImageUploader';
import SymptomSelector from '../components/farmer/SymptomSelector';
import VoiceRecorder from '../components/farmer/VoiceRecorder';
import LocationPicker from '../components/farmer/LocationPicker';
import { api } from '../services/api';
import { offlineDb } from '../services/offlineDb';

export default function FarmerReportWizard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Registered Herd Animals
  const [myAnimals, setMyAnimals] = useState<any[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('');

  // Form State
  const [species, setSpecies] = useState('Cattle');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('Female');
  const [numberAffected, setNumberAffected] = useState(1);

  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');

  const [latitude, setLatitude] = useState<number>(20.5937);
  const [longitude, setLongitude] = useState<number>(78.9629);
  const [locationName, setLocationName] = useState('Field Location (Nagpur District)');

  // History fields
  const [previousIllness, setPreviousIllness] = useState('');
  const [vaccinationStatus, setVaccinationStatus] = useState('Unknown');
  const [recentTreatment, setRecentTreatment] = useState('');
  const [recentMovement, setRecentMovement] = useState(false);
  const [contactWithOtherAnimals, setContactWithOtherAnimals] = useState(true);
  const [recentDeaths, setRecentDeaths] = useState(0);
  const [nearbyDiseaseReports, setNearbyDiseaseReports] = useState(false);

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const animals = await api.getMyAnimals();
        setMyAnimals(animals);
      } catch (e) {
        console.error('Failed to load farmer herd animals:', e);
      }
    };
    fetchAnimals();
  }, []);

  const handleAnimalSelect = (animalId: string) => {
    setSelectedAnimalId(animalId);
    if (!animalId) return;
    const found = myAnimals.find((a) => a.id.toString() === animalId);
    if (found) {
      setSpecies(found.species || 'Cattle');
      setBreed(found.breed || '');
      setAge(found.age_months ? `${found.age_months} months` : '');
      setSex(found.sex || 'Female');
    }
  };

  const steps = [
    { id: 1, title: t('report.step1') },
    { id: 2, title: t('report.step2') },
    { id: 3, title: t('report.step3') },
    { id: 4, title: t('report.step4') },
    { id: 5, title: t('report.step5') },
    { id: 6, title: t('history.title') },
    { id: 7, title: t('report.step7') },
  ];

  const handleNext = () => {
    setErrorMsg(null);
    if (currentStep === 1 && !species) {
      setErrorMsg(t('validation.selectSpecies'));
      return;
    }
    if (currentStep === 2 && symptoms.length === 0) {
      setErrorMsg(t('validation.selectSymptoms'));
      return;
    }
    if (currentStep < 7) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSaveOffline = async () => {
    try {
      const offlinePayload = {
        species,
        breed,
        age,
        sex,
        number_affected: numberAffected,
        symptoms,
        latitude,
        longitude,
        location_name: locationName,
        notes: voiceTranscript,
        primary_language: i18n.language || 'mr',
        history: {
          previous_illness: previousIllness,
          vaccination_status: vaccinationStatus,
          recent_treatment: recentTreatment,
          recent_movement: recentMovement,
          contact_with_other_animals: contactWithOtherAnimals,
          recent_deaths: recentDeaths,
          nearby_disease_reports: nearbyDiseaseReports,
        },
        imageBlob: selectedFile ? selectedFile : null,
      };
      await offlineDb.saveOfflineReport(offlinePayload);
      alert(t('validation.offlineSaved'));
      navigate('/farmer/dashboard');
    } catch (e) {
      console.error(e);
      setErrorMsg(t('validation.offlineSaveFailed'));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    // If offline, save directly to IndexedDB
    if (!navigator.onLine) {
      setSubmissionProgress(t('validation.offlineDevice'));
      await handleSaveOffline();
      setIsSubmitting(false);
      return;
    }

    try {
      setSubmissionProgress(t('validation.submittingStep1'));
      const casePayload = {
        species,
        breed: breed || undefined,
        age: age || undefined,
        sex,
        number_affected: Number(numberAffected) || 1,
        symptoms,
        latitude,
        longitude,
        location_name: locationName,
        primary_language: i18n.language || 'mr',
        notes: voiceTranscript || undefined,
        animal_id: selectedAnimalId ? Number(selectedAnimalId) : undefined,
        history: {
          previous_illness: previousIllness,
          vaccination_status: vaccinationStatus,
          recent_treatment: recentTreatment,
          recent_movement: recentMovement,
          contact_with_other_animals: contactWithOtherAnimals,
          recent_deaths: Number(recentDeaths) || 0,
          nearby_disease_reports: nearbyDiseaseReports,
        },
      };

      const createdCase = await api.createCase(casePayload);
      const caseId = createdCase.id;

      if (selectedFile) {
        setSubmissionProgress(t('validation.submittingStep2'));
        await api.uploadCaseImage(caseId, selectedFile);
        setSubmissionProgress(t('validation.submittingStep3'));
      }

      navigate(`/farmer/cases/${caseId}`);
    } catch (err: any) {
      console.error('Submission failed:', err);
      const msg = err.response?.data?.detail || t('validation.submissionFailed');
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* Step Header */}
      <div className="mb-6 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-navy-950">{t('farmer.quickReport')}</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {t('report.subtitle')}
            </p>
          </div>
          <button
            onClick={handleSaveOffline}
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {t('common.offline')}
          </button>
        </div>

        {/* Progress Bar / Pills */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 overflow-x-auto gap-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                currentStep === step.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : currentStep > step.id
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-black/10">
                {currentStep > step.id ? '✓' : step.id}
              </span>
              <span>{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-900">Action Required</h4>
            <p className="text-xs text-rose-700 mt-0.5 font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Main Wizard Content Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 min-h-[420px]">
        {/* STEP 1: Animal Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-navy-950">{t('report.step1')}</h2>
              <p className="text-xs text-slate-500 font-medium">Provide basic identification for the affected livestock.</p>
            </div>

            {/* Quick Fill from Registered Herd */}
            {myAnimals.length > 0 && (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-700" />
                  {t('report.selectAnimal')}
                </label>
                <select
                  value={selectedAnimalId}
                  onChange={(e) => handleAnimalSelect(e.target.value)}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-semibold text-navy-950 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- {t('report.orEnterManual')} --</option>
                  {myAnimals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.species} ({a.tag_number || `ID #${a.id}`}) - {a.breed || 'Indigen'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('farmer.species')} *</label>
                <select
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-navy-950 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="Cattle">{t('species.cattle')}</option>
                  <option value="Buffalo">{t('species.buffalo')}</option>
                  <option value="Goat">{t('species.goat')}</option>
                  <option value="Sheep">{t('species.sheep')}</option>
                  <option value="Poultry">{t('species.poultry')}</option>
                  <option value="Pig">{t('species.pig')}</option>
                  <option value="Other">{t('species.other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('farmer.breed')} (Optional)</label>
                <input
                  type="text"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="e.g. Gir, Murrah, Sahiwal"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-navy-950 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('farmer.ageMonths')}</label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 3 years, Calf, Adult"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-navy-950 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('farmer.sex')}</label>
                <div className="flex gap-3">
                  {['Female', 'Male'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSex(s)}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all ${
                        sex === s
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {s === 'Female' ? t('farmer.female') : t('farmer.male')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('report.numberOfAffected')}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={numberAffected}
                    onChange={(e) => setNumberAffected(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-28 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-navy-950 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500 font-medium">
                    {t('report.affectedHelp')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Symptoms */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-navy-950">{t('report.step2')}</h2>
              <p className="text-xs text-slate-500">{t('report.symptomsQuestion')}</p>
            </div>
            <SymptomSelector selectedSymptoms={symptoms} onChange={setSymptoms} />
          </div>
        )}

        {/* STEP 3: Photograph Upload */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-navy-950">{t('report.step3')}</h2>
              <p className="text-xs text-slate-500">
                {t('report.uploadPrompt')}
              </p>
            </div>
            <AnimalImageUploader
              onImageSelected={(file) => setSelectedFile(file)}
              selectedFile={selectedFile}
              onImageRemoved={() => setSelectedFile(null)}
            />
            {selectedFile && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-800">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{t('report.visionScreeningNote')}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Voice Note */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('report.step4')}</h2>
              <p className="text-xs text-slate-500 font-medium">
                {t('report.voicePrompt')}
              </p>
            </div>
            <VoiceRecorder
              initialTranscript={voiceTranscript}
              onVoiceRecorded={(_blob, transcript) => {
                setVoiceTranscript(transcript);
              }}
            />
          </div>
        )}

        {/* STEP 5: Location */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('report.step5')}</h2>
              <p className="text-xs text-slate-500 font-medium">
                {t('report.locationPrompt')}
              </p>
            </div>
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              locationName={locationName}
              onChange={(lat, lng, name) => {
                setLatitude(lat);
                setLongitude(lng);
                setLocationName(name);
              }}
            />
          </div>
        )}

        {/* STEP 6: History */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('history.title')}</h2>
              <p className="text-xs text-slate-500 font-medium">
                {t('history.historyDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('history.vaccinationStatus')}</label>
                <select
                  value={vaccinationStatus}
                  onChange={(e) => setVaccinationStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="Vaccinated (Up to date)">{t('history.fullyVaccinated')}</option>
                  <option value="Partially Vaccinated">{t('history.partiallyVaccinated')}</option>
                  <option value="Not Vaccinated">{t('history.notVaccinated')}</option>
                  <option value="Unknown">{t('history.unknown')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('history.recentDeathsLabel')}</label>
                <input
                  type="number"
                  min={0}
                  value={recentDeaths}
                  onChange={(e) => setRecentDeaths(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('history.recentTreatmentsLabel')}</label>
                <input
                  type="text"
                  value={recentTreatment}
                  onChange={(e) => setRecentTreatment(e.target.value)}
                  placeholder={t('history.recentTreatmentPlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={recentMovement}
                    onChange={(e) => setRecentMovement(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-600"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t('history.movementTitle')}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{t('history.movementDesc')}</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={contactWithOtherAnimals}
                    onChange={(e) => setContactWithOtherAnimals(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-600"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t('history.grazingTitle')}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{t('history.grazingDesc')}</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={nearbyDiseaseReports}
                    onChange={(e) => setNearbyDiseaseReports(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-600"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t('history.outbreakTitle')}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{t('history.outbreakDesc')}</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: Review & Submit */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('report.step7')}</h2>
              <p className="text-xs text-slate-500 font-medium">{t('history.reviewSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('report.step1')}</span>
                <div className="text-sm font-bold text-slate-900">
                  {t(`species.${species.toLowerCase()}`, species)} ({t(`farmer.${sex.toLowerCase()}`, sex)})
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  {t('farmer.breed')}: {breed || t('report.indigenous')} | {t('farmer.ageMonths')}: {age || t('report.notSpecified')}
                </div>
                <div className="text-xs text-slate-600 font-medium">{t('report.numberOfAffected')}: <span className="font-bold text-blue-700">{numberAffected}</span></div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('report.step5')}</span>
                <div className="text-sm font-bold text-slate-900">{locationName}</div>
                <div className="text-xs text-slate-600 font-mono font-medium">{latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E</div>
              </div>

              <div className="sm:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('report.step2')}</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {symptoms.map((symp, i) => (
                    <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold rounded-lg">
                      {symp}
                    </span>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('history.attachmentsAndNotes')}</span>
                <div className="text-xs text-slate-700 font-medium space-y-1">
                  <div>
                    <span className="font-bold text-slate-800">{t('report.step3')}: </span>
                    {selectedFile ? (
                      <span className="text-emerald-700 font-bold">✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                    ) : (
                      <span className="text-amber-700">{t('history.noImageAttached')}</span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">{t('report.step4')}: </span>
                    {voiceTranscript ? (
                      <span className="text-emerald-700 font-bold">✓ "{voiceTranscript}"</span>
                    ) : (
                      <span className="text-slate-400">{t('history.noNotes')}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Warning Advisory */}
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed font-medium">
                <strong className="font-bold">{t('history.advisory')}:</strong> {t('common.disclaimer')}
              </div>
            </div>

            {isSubmitting && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                <div className="text-xs text-blue-900 font-semibold">{submissionProgress}</div>
              </div>
            )}
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${
              currentStep === 1 || isSubmitting
                ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            {t('common.back')}
          </button>

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
            >
              {t('common.next')}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.submitting')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t('common.submit')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
