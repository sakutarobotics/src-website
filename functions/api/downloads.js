const VALID_PRODUCTS = new Set([
    "SRAT01",
    "GS90",
    "GSF996",
    "GSP996",
    "GSMG996",
    "SKG100",
    "S14KC",
    "S35KC",
    "S50KC",
    "S70KC",
    "S135KC",
    "GSNP",
    "GSSN6"
]);


/* =========================================================
   RESPUESTA JSON
========================================================= */

function json(
    data,
    status = 200
) {

    return new Response(
        JSON.stringify(
            data
        ),
        {
            status,

            headers: {

                "Content-Type":
                    "application/json; charset=UTF-8",

                "Cache-Control":
                    "no-store"

            }
        }
    );

}



/* =========================================================
   GET
   OBTENER CONTADORES
========================================================= */

export async function onRequestGet(
    context
) {

    try {

        const database =
            context.env.DB;


        if (
            !database
        ) {

            return json(
                {
                    error:
                        "La base de datos DB no está configurada."
                },
                500
            );

        }


        const result =

            await database
                .prepare(`
                    SELECT
                        product_code,
                        downloads
                    FROM
                        download_counts
                `)
                .all();


        const counts = {};


        VALID_PRODUCTS.forEach(
            function(code) {

                counts[
                    code
                ] = 0;

            }
        );


        for (
            const row
            of result.results || []
        ) {

            if (
                VALID_PRODUCTS.has(
                    row.product_code
                )
            ) {

                counts[
                    row.product_code
                ] =

                    Number(
                        row.downloads
                    ) || 0;

            }

        }


        return json({
            counts
        });


    } catch (error) {

        console.error(
            "Error obteniendo descargas:",
            error
        );


        return json(
            {
                error:
                    "No se pudieron obtener las descargas."
            },
            500
        );

    }

}



/* =========================================================
   POST
   REGISTRAR UNA DESCARGA
========================================================= */

export async function onRequestPost(
    context
) {

    try {

        const database =
            context.env.DB;


        if (
            !database
        ) {

            return json(
                {
                    error:
                        "La base de datos DB no está configurada."
                },
                500
            );

        }


        let body;


        try {

            body =
                await context
                    .request
                    .json();


        } catch (error) {

            return json(
                {
                    error:
                        "Solicitud inválida."
                },
                400
            );

        }


        const productCode =

            String(
                body.productCode || ""
            )
                .trim()
                .toUpperCase();


        if (
            !VALID_PRODUCTS.has(
                productCode
            )
        ) {

            return json(
                {
                    error:
                        "Producto no válido."
                },
                400
            );

        }



        /*
         * Si el producto todavía no existe,
         * lo crea con una descarga.
         *
         * Si ya existe,
         * suma +1.
         */

        await database
            .prepare(`
                INSERT INTO download_counts (
                    product_code,
                    downloads
                )

                VALUES (?, 1)

                ON CONFLICT(product_code)

                DO UPDATE SET
                    downloads =
                    downloads + 1
            `)
            .bind(
                productCode
            )
            .run();



        const row =

            await database
                .prepare(`
                    SELECT
                        downloads
                    FROM
                        download_counts

                    WHERE
                        product_code = ?
                `)
                .bind(
                    productCode
                )
                .first();



        return json({

            productCode:

                productCode,


            downloads:

                Number(
                    row?.downloads
                ) || 0

        });


    } catch (error) {

        console.error(
            "Error registrando descarga:",
            error
        );


        return json(
            {
                error:
                    "No se pudo registrar la descarga."
            },
            500
        );

    }

}
