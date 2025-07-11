import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { StreetName, Validity } from "../types/types/types";
import { getFromIndexedDB, openStreetDB, setInIndexedDB } from "./streetsdb";
import { streetsSoundSimilar } from "./checkSound";
import { streetNameList, streetNameListLastUpdated } from "./streetnameslist";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";
import Graphic from "@arcgis/core/Graphic";
import { config } from "../config";
import type { TargetedEvent } from "@arcgis/map-components";
import type { List } from "@esri/calcite-components/components/calcite-list";
import { toTitleCase } from "../utils";

// Define any types for your hook's inputs and outputs
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
  const debounceTimers = useRef<{ [index: number]: number }>({});
  const checkedStreetStorage = useRef(false);
  const [showAdditionalStreetsAdded, setShowAdditionalStreetsAdded] =
    useState<boolean>(false);

  const directions = useMemo(
    () => [
      "NORTH",
      "SOUTH",
      "EAST",
      "WEST",
      "NORTHEAST",
      "NORTHWEST",
      "SOUTHEAST",
      "SOUTHWEST",
    ],
    []
  );

  const typesNotAllowedInName = useMemo(
    () => [
      "STREET",
      "BOULEVARD",
      "CIRCLE",
      "COURT",
      "CRESCENT",
      "DRIVE",
      "LANE",
      "LOOP",
      "PATH",
      "PLACE",
      "ROAD",
      "TRAIL",
      "WAY",
    ],
    []
  );

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
    async (name: string, type: string) => {
      const enteredStreetNames = streetNames.filter(
        (streetName: StreetName) =>
          streetName.streetname.toUpperCase() === name.toUpperCase().trim()
      );

      if (enteredStreetNames.length > 1) {
        return {
          status: "invalid",
          message: "Street name already entered",
          nameValid: false,
          typeValid: type !== "",
        } as Validity;
      }
      if (location.pathname.includes("/status/")) {
        const enteredStreetGraphics = streetNameGraphics.filter(
          (streetName: __esri.Graphic) =>
            streetName.getAttribute("streetname").toUpperCase() ===
            name.toUpperCase().trim()
        );
        if (enteredStreetGraphics.length > 1) {
          return {
            status: "invalid",
            message: "Street name already entered",
            nameValid: false,
            typeValid: type !== "",
          } as Validity;
        }
      }
      const existingStreet = existingStreets.find(
        (street: string) =>
          street.toUpperCase() === name.toUpperCase().trim() ||
          street.toUpperCase().replaceAll(" ", "") ===
            name.toUpperCase().replaceAll(" ", "")
      );
      if (existingStreet) {
        const result = await streetsLookupTable?.queryFeatures({
          where: `ST_NAME like '${existingStreet.toUpperCase()}'`,
          outFields: ["DIR_PREFIX", "ST_NAME", "ST_TYPE", "PLAN_JURIS"],
        });

        let message = `${name} already exists`;
        if (result.features.length > 0) {
          const feature = result.features.at(0);
          const domain = streetsLookupTable.getFieldDomain("PLAN_JURIS");
          let jurisdiction = feature?.getAttribute("PLAN_JURIS");
          if (domain?.type === "coded-value") {
            const codedValue = (
              domain as __esri.CodedValueDomain
            ).codedValues.find(
              (cv: __esri.CodedValue) => jurisdiction === cv.code
            );
            if (codedValue) {
              jurisdiction = codedValue.name;
            }
          }
          message = `${toTitleCase(
            feature?.getAttribute("DIR_PREFIX")
          )} ${toTitleCase(feature?.getAttribute("ST_NAME"))} ${toTitleCase(
            feature?.getAttribute("ST_TYPE")
          )} already exists in ${jurisdiction}`
            .replace(/\s+/g, " ")
            .trim();
        }

        return {
          status: "invalid",
          message: message,
          nameValid: false,
          typeValid: type !== "",
        } as Validity;
      }
      if (!/^[a-zA-Z]+$/.test(name)) {
        return {
          status: "invalid",
          message: "Street name must only contain letters",
          nameValid: false,
          typeValid: type !== "",
        } as Validity;
      }

      directions.forEach((direction) => {
        if (name.toUpperCase().startsWith(direction)) {
          return {
            status: "invalid",
            message: "Street name cannot contain a direction",
            nameValid: false,
            typeValid: type !== "",
          } as Validity;
        }
      });

      typesNotAllowedInName.forEach((type) => {
        if (
          name.toUpperCase().startsWith(type + " ") ||
          name.toUpperCase().endsWith(" " + type)
        ) {
          return {
            status: "invalid",
            message: "Street name cannot contain a street type",
            nameValid: false,
            typeValid: type !== "",
          } as Validity;
        }
      });

      if (name.length < 3)
        return {
          status: "invalid",
          message: "Street name must be at least three characters",
          nameValid: false,
          typeValid: type !== "",
        } as Validity;
      const wordCount = name.split(" ");
      if (wordCount.length > 2)
        return {
          status: "invalid",
          message: "Street name must be two words or less",
          nameValid: false,
          typeValid: type !== "",
        } as Validity;

      const similarStreet = existingStreets.find((street) =>
        streetsSoundSimilar(name.trim(), street)
      );
      if (similarStreet) {
        return {
          status: "valid",
          message: `May sound like ${similarStreet}, you can still submit it`,
          nameValid: true,
          typeValid: type !== "",
        } as Validity;
      }
      if (type === "") {
        return {
          status: "invalid",
          nameValid: true,
          typeValid: false,
        } as Validity;
      }
      return {
        status: "valid",
        message: "",
        nameValid: true,
        typeValid: true,
      } as Validity;
    },
    [
      directions,
      existingStreets,
      streetNameGraphics,
      streetNames,
      streetsLookupTable,
      typesNotAllowedInName,
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

  const handleStreetNameInput = useCallback(
    (input: HTMLCalciteInputTextElement, street: StreetName, i: number) => {
      if (debounceTimers.current[i]) {
        clearTimeout(debounceTimers.current[i]);
      }

      debounceTimers.current[i] = window.setTimeout(
        async () => {
          const validity = await checkStreetName(
            input.value,
            street.streettype
          );

          setStreetNames((prev) =>
            prev.map((s, idx) =>
              idx === i
                ? {
                    ...s,
                    streetname: toTitleCase(input.value),
                    status: validity.status,
                    message: validity.message,
                    nameValid: validity.nameValid,
                    typeValid: validity.typeValid,
                  }
                : s
            )
          );
          delete debounceTimers.current[i];
        },
        400 // debounce delay in ms
      );
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
            order: 1
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
              order: newIndex + maxOrder,
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
