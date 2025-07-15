// Full `useStreetNames.ts` implementation with AbortController fix

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

const useStreetNames = ({ streetsLookupTable, streetsTable, onValid }: UseStreetNamesOptions) => {
  const { graphic, streetNames, setStreetNames, streetNameGraphics, sendEmail } = useStreetNameAppContext();
  const [minStreetNameCount, setMinStreetNameCount] = useState<number>(0);
  const [validStreetsCount, setValidStreetsCount] = useState<number>(0);
  const [existingStreets, setExistingStreets] = useState<string[]>([]);
  const debounceTimers = useRef<{ [index: number]: number }>({});
  const validationControllers = useRef<{ [index: number]: AbortController }>({});
  const checkedStreetStorage = useRef(false);
  const [showAdditionalStreetsAdded, setShowAdditionalStreetsAdded] = useState<boolean>(false);
  const { checkSoundsSimilar } = useCheckSoundWorker(existingStreets);
  const streetNamesRef = useRef<StreetName[]>(streetNames);

  useEffect(() => {
    streetNamesRef.current = streetNames;
  }, [streetNames]);

  const directions = useMemo(() => ["NORTH", "SOUTH", "EAST", "WEST", "NORTHEAST", "NORTHWEST", "SOUTHEAST", "SOUTHWEST"], []);
  const typesNotAllowedInName = useMemo(() => ["STREET", "BOULEVARD", "CIRCLE", "COURT", "CRESCENT", "DRIVE", "LANE", "LOOP", "PATH", "PLACE", "ROAD", "TRAIL", "WAY"], []);

  useEffect(() => {
    const isStatus = location.pathname.includes("/status/");

    if (!graphic || isStatus) return;
    const raw = graphic.getAttribute("streetnamesneeded");
    const min = parseInt(raw);

    if (!isNaN(min)) {
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
      streetNames.filter(
        (streetName: StreetName) => streetName.status === "valid"
      ).length
    );
  }, [graphic, streetNames]);

  const checkStreetName = useCallback(
    async (
      name: string,
      type: string,
      signal?: AbortSignal
    ): Promise<Validity> => {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      const existingStreet = existingStreets.find(
        (s) =>
          s.toUpperCase().replace(/\s+/g, "") ===
          name.toUpperCase().replace(/\s+/g, "")
      );
      if (existingStreet) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
        const result = await streetsLookupTable.queryFeatures({
          where: `ST_NAME like '${existingStreet.toUpperCase()}'`,
          outFields: ["DIR_PREFIX", "ST_NAME", "ST_TYPE", "PLAN_JURIS"],
        });
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
        const feature = result.features[0];
        const message = `${toTitleCase(
          feature?.getAttribute("DIR_PREFIX")
        )} ${toTitleCase(feature?.getAttribute("ST_NAME"))} ${toTitleCase(
          feature?.getAttribute("ST_TYPE")
        )} already exists`;
        return {
          status: "invalid",
          message,
          nameValid: false,
          typeValid: type !== "",
        };
      }

      if (!/^[a-zA-Z\s]+$/.test(name))
        return {
          status: "invalid",
          message: "Street name must only contain letters",
          nameValid: false,
          typeValid: type !== "",
        };
      if (directions.some((d) => name.toUpperCase().startsWith(d)))
        return {
          status: "invalid",
          message: "Street name cannot contain a direction",
          nameValid: false,
          typeValid: type !== "",
        };
      if (
        typesNotAllowedInName.some(
          (t) =>
            name.toUpperCase().startsWith(t + " ") ||
            name.toUpperCase().endsWith(" " + t)
        )
      )
        return {
          status: "invalid",
          message: "Street name cannot contain a street type",
          nameValid: false,
          typeValid: type !== "",
        };

      const words = name.trim().split(/\s+/);
      if (!words.every((w) => w.length >= 3))
        return {
          status: "invalid",
          message:
            "Each word in the street name must be at least three characters",
          nameValid: false,
          typeValid: type !== "",
        };
      if (words.length > 2)
        return {
          status: "invalid",
          message: "Street name must be two words or less",
          nameValid: false,
          typeValid: type !== "",
        };

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
    },
    [
      existingStreets,
      checkSoundsSimilar,
      directions,
      typesNotAllowedInName,
      streetsLookupTable,
    ]
  );

  useEffect(() => {
    if (!checkedStreetStorage.current) {
      checkedStreetStorage.current = true;

      const run = async () => {
        const db = await openStreetDB();

        const storedDate: string =
          (await getFromIndexedDB<string>(
            db,
            "raleigh_street_names_updated"
          )) ?? streetNameListLastUpdated;

        const storedList: string[] =
          (await getFromIndexedDB<string[]>(db, "raleigh_street_names")) ??
          streetNameList
            .replace(/\r?\n/g, "")
            .replace(/\s{2,}/g, " ")
            .trim()
            .split(",");

        const result = await streetsLookupTable.queryFeatures({
          where: `DATE_ST_ENTERED >= date '${storedDate}'`,
          outFields: ["ST_NAME"],
          orderByFields: ["ST_NAME"],
          returnGeometry: false,
        });

        const newNames = result.features
          .map((feature: __esri.Graphic) => feature.getAttribute("ST_NAME"))
          .filter((name: string) => !storedList.includes(name));

        const updatedList = Array.from(
          new Set([...storedList, ...newNames])
        ).sort();

        const today = new Date();
        const formattedDate = `${(today.getMonth() + 1)
          .toString()
          .padStart(2, "0")}/${today
          .getDate()
          .toString()
          .padStart(2, "0")}/${today.getFullYear()}`;

        await setInIndexedDB(db, "raleigh_street_names", updatedList);
        await setInIndexedDB(db, "raleigh_street_names_updated", formattedDate);

        setExistingStreets(updatedList);
      };

      run();
    }
  }, [streetsLookupTable]);

  useEffect(() => {
    if (!graphic) return;
    const isStatus = location.pathname.includes("/status/");
    if (isStatus) {
      const status = graphic?.getAttribute("status");
      const field =
        status === "City Rejected"
          ? "cityapproved"
          : status === "County Rejected"
          ? "countyapproved"
          : undefined;
      if (!field) return;
      const requested = graphic?.getAttribute("streetnamesneeded");
      const approved = streetNameGraphics.filter(
        (graphic) => graphic.getAttribute(field) === "Yes"
      ).length;
      const needed = requested - approved;
      setMinStreetNameCount(needed);
    } else {
      setMinStreetNameCount(graphic.getAttribute("streetnamesneeded"));
    }
  }, [graphic, streetNameGraphics, streetNames]);

  useEffect(() => {
    if (onValid) {
      onValid("submit", validStreetsCount >= minStreetNameCount);
    }
  }, [validStreetsCount, minStreetNameCount, onValid]);

  const handleStreetNameCommit = useCallback(
    (input: HTMLCalciteInputTextElement, i: number) => {
      const value = toTitleCase(input.value);
      const currentStreet = streetNamesRef.current[i];
      if (!currentStreet) return;

      setStreetNames((prev) =>
        prev.map((s, idx) =>
          idx === i
            ? {
                ...s,
                streetname: value,
              }
            : s
        )
      );
    },
    [setStreetNames]
  );

  const handleStreetNameInput = useCallback(
    (input: HTMLCalciteInputTextElement, i: number) => {
      const value = input.value;
      if (debounceTimers.current[i]) clearTimeout(debounceTimers.current[i]);
      if (validationControllers.current[i])
        validationControllers.current[i].abort();

      const controller = new AbortController();
      validationControllers.current[i] = controller;

      setStreetNames((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, streetname: value } : s))
      );

      debounceTimers.current[i] = window.setTimeout(async () => {
        const current = streetNamesRef.current[i];
        if (!current) return;
        try {
          const result = await checkStreetName(
            value,
            current.streettype,
            controller.signal
          );
          setStreetNames((prev) =>
            prev.map((s, idx) =>
              idx === i ? { ...s, ...result, streetname: value } : s
            )
          );
        } catch (e) {
          if ((e as DOMException).name !== "AbortError") console.error(e);
        }
        delete debounceTimers.current[i];
        delete validationControllers.current[i];
      }, 400);
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

  useEffect(() => {
    async function validateAll() {
      const results = await Promise.all(
        streetNames.map((s) => checkStreetName(s.streetname, s.streettype))
      );

      let hasChanged = false;

      const updated = streetNames.map((s, idx) => {
        const r = results[idx];
        if (
          s.status !== r.status ||
          s.message !== r.message ||
          s.nameValid !== r.nameValid ||
          s.typeValid !== r.typeValid
        ) {
          hasChanged = true;
          return {
            ...s,
            status: r.status,
            message: r.message,
            nameValid: r.nameValid,
            typeValid: r.typeValid,
          };
        }
        return s;
      });

      if (hasChanged) {
        setStreetNames(updated);
      }
    }

    validateAll();
  }, [streetNames, checkStreetName, setStreetNames]);

  const deleteStreet = useCallback(
    (i: number) => {
      setStreetNames((prev) => {
        // Remove the item at index `i`
        const filtered = prev.filter((_, idx) => idx !== i);

        // Ensure the array meets the minimum length
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

        // Reassign order values
        const updated = filtered.map((street, index) => ({
          ...street,
          order: index + 1,
        }));

        return updated;
      });
    },
    [minStreetNameCount, setStreetNames]
  );

  const addStreet = useCallback(() => {
    {
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
    }
  }, [setStreetNames, streetNames]);

  const submitAdditionalStreets = async () => {
    if (!streetsTable || !graphic) return;

    const streetGraphics: __esri.Graphic[] = streetNames.map(
      (streetName: StreetName) =>
        new Graphic({
          attributes: {
            streetname: streetName.streetname,
            streettype: streetName.streettype,
            applicationid: graphic?.getAttribute("GlobalID"),
            status: "City Review",
            streetorder: streetName.order,
          },
        })
    );
    console.log(
      await streetsTable.applyEdits({
        addFeatures: streetGraphics,
      })
    );

    sendEmail(config.flows.streetNamesAdded, graphic.getAttribute("GlobalID"));
    setShowAdditionalStreetsAdded(true);
    // graphic?.setAttribute('status', 'City Review');
    // await applicationLayer.applyEdits({
    //   updateFeatures: [graphic]
    // });
    // window.location.reload();
  };
  const handleListOrderChange = useCallback(
    (
      event: TargetedEvent<
        HTMLCalciteListElement,
        List["calciteListOrderChange"]["detail"]
      >
    ) => {
      let maxOrder = 0;
      if (location.pathname.includes("/status/")) {
        maxOrder =
          streetNames.length > 0
            ? Math.max(
                ...streetNameGraphics.map((g) => g.getAttribute("streetorder"))
              )
            : 0;
      }

      setStreetNames((prevStreets: StreetName[]) => {
        const listItems = Array.from(
          event.target.querySelectorAll("calcite-list-item")
        );

        const reordered = listItems
          .map((el, newIndex) => {
            const id = el.id;
            const item = prevStreets.find((s) => s.id === id);
            if (!item) return null;

            return {
              ...item,
              order: newIndex + maxOrder + 1,
            };
          })
          .filter((item): item is StreetName => item !== null);

        return reordered;
      });
    },
    [setStreetNames, streetNameGraphics, streetNames.length]
  );

  const handleAddedDialogClosed = () => {
    setShowAdditionalStreetsAdded(false);
    location.reload();
  };

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
