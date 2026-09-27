import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'

type Coordinate = [
  number,
  number,
  number,
]

type CoordinateNavigatorProps = {
  coords: Coordinate
  onNavigate: (
    coordinate: Coordinate,
  ) => void
}

const STEP_MM = 0.5

function CoordinateNavigator({
  coords,
  onNavigate,
}: CoordinateNavigatorProps) {
  const [editing, setEditing] =
    useState(false)

  const [values, setValues] =
    useState<[string, string, string]>(
      () =>
        coords.map(
          formatCoordinate,
        ) as [
          string,
          string,
          string,
        ],
    )

  useEffect(() => {
    if (editing) {
      return
    }

    setValues(
      coords.map(
        formatCoordinate,
      ) as [
        string,
        string,
        string,
      ],
    )
  }, [
    coords,
    editing,
  ])

  const parsed =
    useMemo(
      () =>
        values.map(
          parseCoordinate,
        ) as [
          number | null,
          number | null,
          number | null,
        ],
      [values],
    )

  const valid =
    parsed.every(
      (value) =>
        value !== null,
    )

  function updateValue(
    index: number,
    value: string,
  ) {
    setValues(
      (current) => {
        const next =
          [...current] as [
            string,
            string,
            string,
          ]

        next[index] =
          value

        return next
      },
    )
  }

  function stepValue(
    index: number,
    direction: 1 | -1,
  ) {
    const current =
      parseCoordinate(
        values[index],
      ) ??
      coords[index]

    const next =
      roundCoordinate(
        current +
          direction *
            STEP_MM,
      )

    updateValue(
      index,
      formatTypedCoordinate(
        next,
      ),
    )
  }

  function handleKeyDown(
    index: number,
    event:
      KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      event.key !== 'ArrowUp' &&
      event.key !== 'ArrowDown'
    ) {
      return
    }

    event.preventDefault()

    stepValue(
      index,
      event.key === 'ArrowUp'
        ? 1
        : -1,
    )
  }

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!valid) {
      return
    }

    const coordinate:
      Coordinate = [
        parsed[0] as number,
        parsed[1] as number,
        parsed[2] as number,
      ]

    setValues(
      coordinate.map(
        formatCoordinate,
      ) as [
        string,
        string,
        string,
      ],
    )

    setEditing(false)
    onNavigate(coordinate)
  }

  return (
    <form
      className="coordinate-readout coordinate-navigator"
      aria-label="MNI coordinate navigation"
      noValidate
      onSubmit={handleSubmit}
      onFocus={() =>
        setEditing(true)
      }
      onBlur={(event) => {
        const nextFocus =
          event.relatedTarget

        if (
          nextFocus instanceof Node &&
          event.currentTarget.contains(
            nextFocus,
          )
        ) {
          return
        }

        setEditing(false)

        setValues(
          coords.map(
            formatCoordinate,
          ) as [
            string,
            string,
            string,
          ],
        )
      }}
    >
      {(
        [
          'x',
          'y',
          'z',
        ] as const
      ).map(
        (axis, index) => (
          <label
            key={axis}
            className="coordinate-axis"
          >
            <span className="coordinate-axis-label">
              {axis}
            </span>

            <input
              className="coordinate-input"
              type="number"
              inputMode="decimal"
              step={STEP_MM}
              value={
                values[index]
              }
              aria-label={`${axis} coordinate`}
              onChange={(
                event,
              ) =>
                updateValue(
                  index,
                  event.target
                    .value,
                )
              }
              onKeyDown={(
                event,
              ) =>
                handleKeyDown(
                  index,
                  event,
                )
              }
            />
          </label>
        ),
      )}

      <button
        type="submit"
        className="coordinate-go-button"
        disabled={!valid}
      >
        Go
      </button>
    </form>
  )
}

function parseCoordinate(
  value: string,
) {
  const trimmed =
    value.trim()

  if (!trimmed) {
    return null
  }

  const parsed =
    Number(trimmed)

  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    return null
  }

  return parsed
}

function roundCoordinate(
  value: number,
) {
  return Number(
    value.toFixed(6),
  )
}

function formatTypedCoordinate(
  value: number,
) {
  return String(
    roundCoordinate(
      value,
    ),
  )
}

/*
 * Crosshair locations can contain tiny floating-point
 * noise. Coordinates that sit on a half-millimetre grid
 * are therefore shown with one decimal place. Arbitrary
 * entered coordinates keep up to two meaningful decimals.
 */
function formatCoordinate(
  value: number,
) {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return ''
  }

  const halfMillimetre =
    Math.round(
      value * 2,
    ) / 2

  if (
    Math.abs(
      value -
        halfMillimetre,
    ) < 0.005
  ) {
    return halfMillimetre
      .toFixed(1)
  }

  return String(
    Number(
      value.toFixed(2),
    ),
  )
}

export default CoordinateNavigator
