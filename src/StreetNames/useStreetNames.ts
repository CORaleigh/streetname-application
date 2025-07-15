import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { StreetName, Validity } from "../types/types/types";
import { getFromIndexedDB, openStreetDB, setInIndexedDB } from "./streetsdb";
import { streetNameList, streetNameListLastUpdated } from "./streetnameslist";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";
import Graphic from "@arcgis/core/Graphic";
import { config } from "../config";
import type { TargetedEvent } from "@arcgis/map-components";
import type { List } from "@esri/calcite-components/components/calcite-list";
import { toTitleCase } from "../utils";
import useCheckSoundWorker from "./useCheckSoundWorker";

interface UseStreetNamesOptions {
  streetsLookupTable: __esri.FeatureLayer;
  streetsTable: __esri.FeatureLayer;
  onValid?: (step: string, isValid: boolean) => void;
}

const useStreetNames = ({
  streetsLookupTable,
  streetsTable,
  onValid,
}: UseStreetNamesOptions) => {
  const {
    graphic,
    streetNames,
    setStreetNames,
    streetNameGraphics,
    sendEmail,
  } = useStreetNameAppContext();

  const [minStreetNameCount, setMinStreetNameCount] = useState<number>(0);
  const [validStreetsCount, setValidStreetsCount] = useState<number>(0);
  const [existingStreets, setExistingStreets] = useState<string[]>([]);

  const checkedStreetStorage = useRef(false);
  const [showAdditionalStreetsAdded, setShowAdditionalStreetsAdded] =
    useState<boolean>(false);

  const { checkSoundsSimilar } = useCheckSoundWorker(existingStreets);
  const streetNamesRef = useRef<StreetName[]>(streetNames);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const latestInputsRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    streetNamesRef.current = streetNames;
  }, [streetNames]);

  const directions = useMemo(() => [
    "NORTH", "SOUTH", "EAST", "WEST",
    "NORTHEAST", "NORTHWEST", "SOUTHEAST", "SOUTHWEST"
  ], []);

  const typesNotAllowedInName = useMemo(() => [
    "STREET", "BOULEVARD", "CIRCLE", "COURT", "CRESCENT", "DRIVE",
    "LANE", "LOOP", "PATH", "PLACE", "ROAD", "TRAIL", "WAY"
  ], []);

  useEffect(() => {
    const isStatus = location.pathname.includes("/status/");
    if (!graphic || isStatus) return;
    const raw = graphic.getAttribute("streetnamesneeded");
    const min = parseInt(raw);
    if (!isNaN(min)) {
      setMinStreetNameCount(min);
      setStreetNames((prev) => {
        const updated = [...prev];
        while (updated.length < min) {
          updated.push({
            streetname: "",
            streettype: "",
            status: "invalid",
            message: "required",
            nameValid: false,
            typeValid: false,
            order: updated.length + 1,
            id: crypto.randomUUID(),
          });
        }
        return updated;
      });
    }
  }, [graphic, setStreetNames]);

  useEffect(() => {
    setValidStreetsCount(
      streetNames.filter((s) => s.status === "valid").length
    );
  }, [graphic, streetNames]);

  const checkStreetName = useCallback(async (
    name: string,
    type: string,
    signal?: AbortSignal
  ): Promise<Validity> => {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const existingStreet = existingStreets.find(
      (s) => s.toUpperCase().replace(/\s+/g, "") === name.toUpperCase().replace(/\s+/g, "")
    );
    if (existingStreet) {
      const result = await streetsLookupTable.queryFeatures({
        where: `ST_NAME like '${existingStreet.toUpperCase()}'`,
        outFields: ["DIR_PREFIX", "ST_NAME", "ST_TYPE", "PLAN_JURIS"],
      });
      const feature = result.features[0];
      const message = `${toTitleCase(feature?.getAttribute("DIR_PREFIX"))} ${toTitleCase(
        feature?.getAttribute("ST_NAME")
      )} ${toTitleCase(feature?.getAttribute("ST_TYPE"))} already exists`;
      return {
        status: "invalid",
        message,
        nameValid: false,
        typeValid: type !== "",
      };
    }

    if (!name)
      return { status: "invalid", message: "Street name is required", nameValid: false, typeValid: false };

    if (!/^[a-zA-Z\s]+$/.test(name))
      return { status: "invalid", message: "Street name must only contain letters", nameValid: false, typeValid: type !== "" };

    if (directions.some((d) => name.toUpperCase().startsWith(d)))
      return { status: "invalid", message: "Street name cannot contain a direction", nameValid: false, typeValid: type !== "" };

    if (typesNotAllowedInName.some((t) => name.toUpperCase().startsWith(t + " ") || name.toUpperCase().endsWith(" " + t)))
      return { status: "invalid", message: "Street name cannot contain a street type", nameValid: false, typeValid: type !== "" };

    const words = name.trim().split(/\s+/);
    if (!words.every((w) => w.length >= 3))
      return { status: "invalid", message: "Each word must be at least three characters", nameValid: false, typeValid: type !== "" };

    if (words.length > 2)
      return { status: "invalid", message: "Street name must be two words or less", nameValid: false, typeValid: type !== "" };

    const similarStreet = await checkSoundsSimilar(name.trim());
    if (similarStreet?.similar)
      return {
        status: "valid",
        message: `May sound like ${similarStreet.streetname}`,
        nameValid: true,
        typeValid: type !== "",
      };

    return type === ""
      ? { status: "invalid", message: "Street type is required", nameValid: true, typeValid: false }
      : { status: "valid", message: "", nameValid: true, typeValid: true };
  }, [existingStreets, checkSoundsSimilar, directions, typesNotAllowedInName, streetsLookupTable]);

  useEffect(() => {
    if (checkedStreetStorage.current) return;
    checkedStreetStorage.current = true;

    const run = async () => {
      const db = await openStreetDB();
      const storedDate = (await getFromIndexedDB<string>(db, "raleigh_street_names_updated")) ?? streetNameListLastUpdated;
      const storedList = (await getFromIndexedDB<string[]>(db, "raleigh_street_names")) ??
        streetNameList.replace(/\r?\n/g, "").replace(/\s{2,}/g, " ").trim().split(",");

      const result = await streetsLookupTable.queryFeatures({
        where: `DATE_ST_ENTERED >= date '${storedDate}'`,
        outFields: ["ST_NAME"],
        orderByFields: ["ST_NAME"],
        returnGeometry: false,
      });

      const newNames = result.features
        .map((f) => f.getAttribute("ST_NAME"))
        .filter((name) => !storedList.includes(name));

      const updatedList = Array.from(new Set([...storedList, ...newNames])).sort();

      const today = new Date();
      const formattedDate = `${(today.getMonth() + 1).toString().padStart(2, "0")}/${today
        .getDate()
        .toString()
        .padStart(2, "0")}/${today.getFullYear()}`;

      await setInIndexedDB(db, "raleigh_street_names", updatedList);
      await setInIndexedDB(db, "raleigh_street_names_updated", formattedDate);

      setExistingStreets(updatedList);
    };

    run();
  }, [streetsLookupTable]);

  const handleStreetNameInput = useCallback(
  (input: HTMLCalciteInputTextElement, i: number) => {
    const rawValue = input.value;
    const trimmed = rawValue.trim();
    const titleCased = toTitleCase(trimmed);

    latestInputsRef.current.set(i, trimmed); // Save raw trimmed

    // Immediately reflect raw input in UI
    setStreetNames((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, streetname: rawValue } : s))
    );

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (controllerRef.current) controllerRef.current.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const currentStreet = streetNamesRef.current[i];
        const result = await checkStreetName(titleCased, currentStreet?.streettype, controller.signal);

        // Only apply result if input hasn’t changed
        if (latestInputsRef.current.get(i) === trimmed) {
          setStreetNames((prev) =>
            prev.map((s, idx) =>
              idx === i
                ? {
                    ...s,
                    ...result,
                    streetname: rawValue, // don't override what the user typed
                  }
                : s
            )
          );
        }
      } catch (e) {
        if ((e as DOMException).name !== "AbortError") {
          console.error("Validation error:", e);
        }
      }
    }, 300);
  },
  [checkStreetName, setStreetNames]
);


  const handleStreetNameCommit = useCallback(
    async (input: HTMLCalciteInputTextElement, i: number) => {
      const value = toTitleCase(input.value.trim());
      const currentStreet = streetNamesRef.current[i];
      if (!currentStreet) return;

      latestInputsRef.current.set(i, value);

      setStreetNames((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, streetname: value } : s))
      );

      try {
        const result = await checkStreetName(value, currentStreet.streettype);
        if (latestInputsRef.current.get(i) === value) {
          setStreetNames((prev) =>
            prev.map((s, idx) =>
              idx === i ? { ...s, ...result, streetname: value } : s
            )
          );
        }
      } catch (e) {
        console.error("Validation error in commit:", e);
      }
    },
    [checkStreetName, setStreetNames]
  );

  const handleStreetTypeSelect = useCallback(
    async (select: HTMLCalciteSelectElement, street: StreetName, i: number) => {
      const validity = await checkStreetName(street.streetname, select.value);
      setStreetNames((prev) =>
        prev.map((s, idx) =>
          idx === i
            ? {
                ...s,
                streettype: select.value,
                status: validity.status,
                message: validity.message,
                nameValid: validity.nameValid,
                typeValid: validity.typeValid,
              }
            : s
        )
      );
    },
    [checkStreetName, setStreetNames]
  );

  const deleteStreet = useCallback(
    (i: number) => {
      setStreetNames((prev) => {
        const filtered = prev.filter((_, idx) => idx !== i);
        while (filtered.length < minStreetNameCount!) {
          filtered.push({
            streetname: "",
            streettype: "",
            status: "invalid",
            message: "required",
            nameValid: false,
            typeValid: false,
            id: crypto.randomUUID(),
            order: 1,
          });
        }
        return filtered.map((street, index) => ({
          ...street,
          order: index + 1,
        }));
      });
    },
    [minStreetNameCount, setStreetNames]
  );

  const addStreet = useCallback(() => {
    const maxOrder =
      streetNames.length > 0
        ? Math.max(...streetNames.map((g) => g.order))
        : 0;
    setStreetNames((prev) => [
      ...prev,
      {
        streetname: "",
        streettype: "",
        status: "invalid",
        message: "required",
        nameValid: false,
        typeValid: false,
        graphic: new Graphic(),
        order: maxOrder + 1,
        id: crypto.randomUUID(),
      },
    ]);
  }, [setStreetNames, streetNames]);

  const submitAdditionalStreets = async () => {
    if (!streetsTable || !graphic) return;

    const streetGraphics: __esri.Graphic[] = streetNames.map((s) =>
      new Graphic({
        attributes: {
          streetname: s.streetname,
          streettype: s.streettype,
          applicationid: graphic.getAttribute("GlobalID"),
          status: "City Review",
          streetorder: s.order,
        },
      })
    );

    await streetsTable.applyEdits({ addFeatures: streetGraphics });
    sendEmail(config.flows.streetNamesAdded, graphic.getAttribute("GlobalID"));
    setShowAdditionalStreetsAdded(true);
  };

  const handleListOrderChange = useCallback(
    (
      event: TargetedEvent<HTMLCalciteListElement, List["calciteListOrderChange"]["detail"]>
    ) => {
      let maxOrder = 0;
      if (location.pathname.includes("/status/")) {
        maxOrder = streetNames.length > 0
          ? Math.max(...streetNameGraphics.map((g) => g.getAttribute("streetorder")))
          : 0;
      }

      setStreetNames((prev) => {
        const listItems = Array.from(
          event.target.querySelectorAll("calcite-list-item")
        );

        return listItems
          .map((el, index) => {
            const id = el.id;
            const s = prev.find((s) => s.id === id);
            return s ? { ...s, order: index + maxOrder + 1 } : null;
          })
          .filter((s): s is StreetName => s !== null);
      });
    },
    [setStreetNames, streetNames.length, streetNameGraphics]
  );

  const handleAddedDialogClosed = () => {
    setShowAdditionalStreetsAdded(false);
    location.reload();
  };

  useEffect(() => {
    if (onValid) {
      onValid("submit", validStreetsCount >= minStreetNameCount);
    }
  }, [validStreetsCount, minStreetNameCount, onValid]);

  return {
    streetNames,
    validStreetsCount,
    minStreetNameCount,
    handleStreetNameInput,
    handleStreetNameCommit,
    handleStreetTypeSelect,
    deleteStreet,
    addStreet,
    submitAdditionalStreets,
    handleListOrderChange,
    handleAddedDialogClosed,
    showAdditionalStreetsAdded,
  };
};

export default useStreetNames;
