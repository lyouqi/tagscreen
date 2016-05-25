package org.tagsys.tagscreen;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.apache.log4j.BasicConfigurator;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.apache.mina.common.RuntimeIOException;
import org.sql2o.logging.SysOutLogger;

import com.google.gson.Gson;

import spark.Filter;
import spark.Request;
import spark.Response;
import spark.Spark;

public class Server {
	
	private static Gson gson = new Gson();

	public static void main(String[] args) {


		BasicConfigurator.configure();

		Logger.getRootLogger().setLevel(Level.INFO);

		Spark.port(9093);

		Spark.webSocket("/socket", WebSocketHandler.class);

		Spark.externalStaticFileLocation("public");

		Spark.before((request, response) -> {
			response.header("Access-Control-Allow-Origin", "*");
			response.header("Access-Control-Request-Method", "*");
			response.header("Access-Control-Allow-Headers", "X-Requested-With");
		});

		Spark.init();

		Spark.get("/", (req, resp) -> {
			resp.redirect("/index.html");
			return "";
		});

		Spark.get("/lib", (req, resp) -> {

			resp.type("application/json");
			JsonResult result = new JsonResult();
			result.put("library", Library.getInstance());
			
			System.out.println(result);
			return result;
		});

		Spark.post("/seekPreamble", (req, resp) -> {

			System.out.println("seek preamble.");

			HashMap<String, ArrayList<Double>> body = gson.fromJson(req.body(),
					new HashMap<String, ArrayList<Double>>().getClass());

			ArrayList<Double> signalArray = body.get("signal");

			double[] signal = new double[signalArray.size()];

			System.out.println("signal:("+signal.length+")");
			for (int i = 0; i < signalArray.size(); i++) {
				signal[i] = signalArray.get(i).doubleValue();
//				System.out.print(signal[i]+",");
			}
			System.out.println();

			JsonResult result = new JsonResult();
			Correlation cor = ChirpUtil.seekPreamable(signal);
			System.out.println(cor);

			result.put("index", cor.getIndex());
			result.put("max", cor.getMax());

			return result;
		});

		Spark.exception(RuntimeIOException.class, (e, req, resp) -> {

			resp.status(200);
			resp.type("application/json");

			resp.body(new JsonResult(505, e.getMessage()).toString());

		});

	}

}
